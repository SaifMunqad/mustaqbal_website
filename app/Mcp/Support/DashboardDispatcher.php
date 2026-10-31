<?php

declare(strict_types=1);

namespace App\Mcp\Support;

use App\Http\Middleware\EnsureUserHasRole;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request as HttpRequest;
use Illuminate\Http\UploadedFile;
use Illuminate\Session\ArraySessionHandler;
use Illuminate\Session\Store as SessionStore;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Response as InertiaResponse;
use Laravel\Mcp\Request as McpRequest;
use Laravel\Mcp\Response as McpResponse;
use Laravel\Mcp\ResponseFactory;
use ReflectionMethod;
use ReflectionNamedType;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Throwable;

/**
 * Bridges the MCP tool layer to the *existing* dashboard controllers.
 *
 * The whole point of this dispatcher is that it never re-implements a single
 * business rule: it reconstructs a real Illuminate HTTP request from the MCP
 * tool arguments, replays the same route middleware (role / active / verified)
 * that guards the dashboard in `routes/web.php`, and then calls the exact
 * controller method the browser would hit. Whatever a controller returns for the
 * web (an Inertia page, a redirect with flash/errors, or a JSON response) is
 * translated back into a machine-readable MCP response.
 *
 * This is what keeps the MCP surface honest with the dashboard: a user who is
 * allowed to do something in the browser is allowed to do it through MCP, and a
 * user who is not, is blocked by the very same middleware and policies.
 */
class DashboardDispatcher
{
    /**
     * Middleware the dispatcher can honour: the group names whose infrastructure
     * is rebuilt manually, the auth guard the acting user is planted into, and
     * the three gates replayed below. Anything else on a matched route fails
     * closed, so a future route middleware can never be bypassed silently.
     *
     * @var list<string>
     */
    private const REPLAYABLE = ['web', 'api', 'auth', 'verified', 'active', 'role'];

    /**
     * @param  array<int, string>  $modelParams  argument names that are route-model bindings
     * @param  array<string, UploadedFile>  $files  in-memory files exposed to the FormRequest (multipart-equivalent)
     */
    public function run(
        McpRequest $mcpRequest,
        string $controller,
        string $action,
        string $verb = 'GET',
        array $modelParams = [],
        array $files = [],
    ): McpResponse|ResponseFactory {
        return $this->execute($mcpRequest, $controller, $action, $verb, $modelParams, $files, fn (mixed $result, HttpRequest $request, SessionStore $session): McpResponse|ResponseFactory => $this->translate($result, $request, $session));
    }

    /**
     * Run a read action and hand back its raw Inertia props (or array result)
     * instead of an MCP response. Composite tools (e.g. the section-level
     * builder tools) use this to inspect the current state before they write
     * it back through the same controller the browser uses.
     *
     * @param  array<int, string>  $modelParams
     * @return array<string, mixed>|McpResponse|ResponseFactory props on success, an error response on failure
     */
    public function props(McpRequest $mcpRequest, string $controller, string $action, array $modelParams = []): array|McpResponse|ResponseFactory
    {
        return $this->execute($mcpRequest, $controller, $action, 'GET', $modelParams, [], function (mixed $result, HttpRequest $request): array {
            if ($result instanceof InertiaResponse) {
                $payload = json_decode((string) $result->toResponse($request)->getContent(), true) ?: [];

                return $payload['props'] ?? [];
            }

            return is_array($result) ? $result : [];
        });
    }

    /**
     * The shared pipeline: rebuild a real request, replay the route guards,
     * call the controller action, then let the caller translate the result.
     *
     * @param  array<int, string>  $modelParams
     * @param  array<string, UploadedFile>  $files
     * @param  callable(mixed, HttpRequest, SessionStore): (McpResponse|ResponseFactory|array)  $then
     */
    private function execute(
        McpRequest $mcpRequest,
        string $controller,
        string $action,
        string $verb,
        array $modelParams,
        array $files,
        callable $then,
    ): McpResponse|ResponseFactory|array {
        $user = $mcpRequest->user();

        if (! $user) {
            return $this->failure('unauthenticated', 'Authentication is required to use the dashboard server.');
        }

        $arguments = $mcpRequest->all();

        $routeParams = [];
        foreach ($modelParams as $key) {
            if (array_key_exists($key, $arguments)) {
                $routeParams[$key] = $arguments[$key];
                unset($arguments[$key]);
            }
        }

        // Snapshot the ambient state before overwriting it, so composite tools
        // (which call the pipeline more than once per MCP request) always start
        // from a clean slate and the real request state is handed back at the
        // end instead of leaking.
        //
        // NOTE: the auth Manager proxies user()/setUser()/forgetUser() to
        // whatever guard is currently default — a sanctum-driven request would
        // hit RequestGuard, which has none of those. So we capture the web
        // guard's in-memory user explicitly instead of playing guard roulette.
        $webGuard = Auth::guard('web');

        $snapshot = [
            'request' => app()->bound('request') ? app('request') : null,
            'driver' => Auth::getDefaultDriver(),
            'web_user' => method_exists($webGuard, 'getUser') ? $webGuard->getUser() : null,
            'session' => app()->bound('session.store') ? app('session.store') : null,
        ];

        $request = $this->buildRequest($action, $verb, $arguments, $files);
        $session = $this->installSession($request);

        $request->setUserResolver(fn (): object => $user);

        app()->instance('request', $request);

        Auth::shouldUse('web');
        Auth::guard('web')->setUser($user);
        Auth::setUser($user);

        try {
            $instance = app()->make($controller);

            // Resolve route-model bindings up front and expose them through a
            // lightweight route object so `$request->route('model')` — relied on
            // by FormRequest::authorize() and policy lookups — behaves exactly as
            // it does during a real routed browser request.
            $bindings = $this->resolveBindings($instance, $action, $routeParams);

            $route = $this->makeRouteStub($bindings);
            $request->setRouteResolver(fn () => $route);

            $this->enforceRouteGuards($controller, $action, $request, $user);

            $parameters = $this->resolveParameters($instance, $action, $request, $user, $bindings);

            $result = $instance->{$action}(...$parameters);

            return $then($result, $request, $session);
        } catch (\Illuminate\Validation\ValidationException $exception) {
            return McpResponse::structured([
                'status' => 'validation_failed',
                'errors' => $exception->errors(),
            ]);
        } catch (\Illuminate\Auth\Access\AuthorizationException $exception) {
            return $this->failure('forbidden', 'Permission denied for this action: '.$exception->getMessage());
        } catch (ModelNotFoundException $exception) {
            return $this->failure('not_found', 'The requested record could not be found.');
        } catch (HttpException $exception) {
            return $this->failure(
                match (true) {
                    $exception->getStatusCode() === 401 => 'unauthenticated',
                    $exception->getStatusCode() === 429 => 'throttled',
                    default => 'forbidden',
                },
                $exception->getMessage() !== ''
                    ? $exception->getMessage()
                    : 'This action is not authorized for your role.',
            );
        } catch (Throwable $exception) {
            report($exception);

            return $this->failure('failed', 'The dashboard action failed: '.$exception->getMessage());
        } finally {
            $this->restore($snapshot);
        }
    }

    /**
     * Hand the container and auth manager back the state that was live before
     * this pipeline ran.
     *
     * @param  array<string, mixed>  $snapshot
     */
    private function restore(array $snapshot): void
    {
        if ($snapshot['request'] instanceof HttpRequest) {
            app()->instance('request', $snapshot['request']);
        }

        if ($snapshot['session'] instanceof \Illuminate\Contracts\Session\Session) {
            app()->instance('session.store', $snapshot['session']);
            app()->instance(\Illuminate\Contracts\Session\Session::class, $snapshot['session']);
        }

        // Re-derive the redirector so it binds to the restored session store.
        app()->forgetInstance('redirect');

        Auth::shouldUse((string) $snapshot['driver']);

        $web = Auth::guard('web');

        if ($snapshot['web_user'] instanceof \Illuminate\Contracts\Auth\Authenticatable) {
            $web->setUser($snapshot['web_user']);
        } elseif (method_exists($web, 'forgetUser')) {
            $web->forgetUser();
        }
    }

    /**
     * A machine-readable error: the reason code lets an agent branch (retry a
     * read after not_found, stop after forbidden) instead of parsing prose.
     */
    private function failure(string $reason, string $message): McpResponse
    {
        return McpResponse::error((string) json_encode([
            'status' => 'error',
            'reason' => $reason,
            'message' => $message,
        ], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE));
    }

    /**
     * Reconstruct a real Illuminate request so the controller (and any injected
     * FormRequest) behaves exactly as it does for a browser visit.
     *
     * @param  array<string, mixed>  $arguments
     * @param  array<string, UploadedFile>  $files
     */
    private function buildRequest(string $action, string $verb, array $arguments, array $files = []): HttpRequest
    {
        $uri = '/dashboard/'.ltrim($action, '/');

        if (strtoupper($verb) === 'GET') {
            $request = HttpRequest::create($uri, 'GET', $arguments);
        } else {
            // JSON body keeps PUT/PATCH/DELETE payloads reachable through the
            // request's input source, which is what FormRequests validate.
            $request = HttpRequest::create(
                $uri,
                strtoupper($verb),
                [],
                [],
                [],
                [
                    'CONTENT_TYPE' => 'application/json',
                    'HTTP_ACCEPT' => 'application/json',
                ],
                json_encode($arguments, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
            );
        }

        // Ask Inertia's response object to serialise page props to JSON instead
        // of rendering the SPA shell, so read actions yield data we can return.
        $request->headers->set('X-Inertia', 'true');

        // Uploaded files ride the same request object a browser multipart would
        // produce, so FormRequest file rules and $request->file() behave unchanged.
        foreach ($files as $key => $file) {
            $request->files->set($key, $file);
        }

        return $request;
    }

    /**
     * Provide an isolated, in-memory session so `->with()` / `->withErrors()`
     * flash (and any `$request->session()` usage inside a controller) does not
     * touch the real session store.
     */
    private function installSession(HttpRequest $request): SessionStore
    {
        $store = new SessionStore('mcp', new ArraySessionHandler(60), 'mcp-'.bin2hex(random_bytes(8)));
        $store->start();
        $store->put('_previous.url', url('/dashboard'));

        app()->instance('session.store', $store);
        app()->instance(\Illuminate\Contracts\Session\Session::class, $store);
        app()->forgetInstance('redirect');

        $request->setLaravelSession($store);

        return $store;
    }

    /**
     * Replay the middleware that protects the matching dashboard route so an MCP
     * caller faces the identical role / verified / active checks as a browser.
     * Fails closed: an action with no route, or with any middleware beyond the
     * replayable set (on *every* route that maps to it, not just the first),
     * is refused rather than silently running ungated.
     *
     * @param  \Illuminate\Contracts\Auth\Authenticatable&object  $user
     */
    private function enforceRouteGuards(string $controller, string $action, HttpRequest $request, object $user): void
    {
        $matching = collect(Route::getRoutes())
            ->filter(fn ($route) => $route->getAction('controller') === $controller.'@'.$action);

        if ($matching->isEmpty()) {
            throw new HttpException(403, 'This dashboard action is not routed, so its guards cannot be replayed over MCP. Use the web dashboard.');
        }

        $middleware = $matching
            ->flatMap(fn ($route) => $route->gatherMiddleware())
            ->filter(fn (mixed $m): bool => is_string($m))
            ->unique()
            ->values();

        $active = $user->isSuspended();

        foreach ($middleware as $item) {
            $name = explode(':', $item, 2)[0];

            if (! in_array($name, self::REPLAYABLE, true)) {
                throw new HttpException(403, "This dashboard action is additionally guarded by [{$item}] middleware that the MCP server cannot replay; perform it in the web dashboard.");
            }

            if ($item === 'active' && $active) {
                throw new HttpException(403, 'Suspended accounts cannot use the dashboard server.');
            }

            if ($item === 'verified'
                && $user instanceof MustVerifyEmail
                && ! $user->hasVerifiedEmail()) {
                throw new HttpException(403, 'Your account email must be verified to use the dashboard server.');
            }

            if (str_starts_with($item, 'role:')) {
                $roles = explode(':', substr($item, strlen('role:')));

                app(EnsureUserHasRole::class)->handle(
                    $request,
                    fn () => new \Illuminate\Http\Response('ok'),
                    ...$roles,
                );
            }
        }
    }

    /**
     * Resolve the controller method's arguments by type so we never have to
     * hand-write per-action glue.
     *
     * @param  array<string, mixed>  $bindings  route-model bound instances keyed by parameter name
     * @return array<int, mixed>
     */
    private function resolveParameters(object $instance, string $method, HttpRequest $request, object $user, array $bindings): array
    {
        $reflection = new ReflectionMethod($instance, $method);
        $resolved = [];

        foreach ($reflection->getParameters() as $parameter) {
            $type = $parameter->getType();

            if (! $type instanceof ReflectionNamedType || $type->isBuiltin()) {
                $name = $parameter->getName();

                if (array_key_exists($name, $bindings)) {
                    $resolved[] = $bindings[$name];

                    continue;
                }

                // A scalar with a default (e.g. the builder's `string $page =
                // 'home'`) must still honour a submitted value; only an absent
                // argument falls through to the method's own default, which is
                // what omitting it from the call achieves.
                if ($parameter->isDefaultValueAvailable()) {
                    if ($request->filled($name)) {
                        $resolved[] = $request->input($name);

                        continue;
                    }

                    break;
                }

                $resolved[] = $request->input($name);

                continue;
            }

            $class = $type->getName();

            if (is_a($class, FormRequest::class, true)) {
                $resolved[] = $this->makeFormRequest($class, $request, $user);

                continue;
            }

            if ($class === HttpRequest::class || is_a($class, HttpRequest::class, true)) {
                $resolved[] = $request;

                continue;
            }

            if (is_a($class, Model::class, true)) {
                $name = $parameter->getName();

                if (array_key_exists($name, $bindings)) {
                    $resolved[] = $bindings[$name];

                    continue;
                }

                $value = $request->input($name);

                if (($value === null || $value === '') && $type->allowsNull()) {
                    $resolved[] = null;

                    continue;
                }

                $resolved[] = $this->resolveModel($class, $value);

                continue;
            }

            if (is_a($class, \Illuminate\Contracts\Auth\Authenticatable::class, true) || $class === \App\Models\User::class) {
                $resolved[] = $user;

                continue;
            }

            if ($parameter->isDefaultValueAvailable()) {
                break;
            }

            $resolved[] = app($class);
        }

        return $resolved;
    }

    /**
     * Resolve every route-model binding the controller method expects so the
     * instances can be exposed through the request's route and reused as call
     * arguments — mirroring how the router would substitute them.
     *
     * @param  array<string, mixed>  $routeParams  raw bound values keyed by parameter name
     * @return array<string, Model|null>
     */
    private function resolveBindings(object $instance, string $method, array $routeParams): array
    {
        $bindings = [];

        foreach ((new ReflectionMethod($instance, $method))->getParameters() as $parameter) {
            $type = $parameter->getType();

            if (! $type instanceof ReflectionNamedType || $type->isBuiltin()) {
                continue;
            }

            $class = $type->getName();

            if (! is_a($class, Model::class, true)) {
                continue;
            }

            $name = $parameter->getName();
            $value = $routeParams[$name] ?? null;

            if (($value === null || $value === '') && $type->allowsNull()) {
                $bindings[$name] = null;

                continue;
            }

            $bindings[$name] = $this->resolveModel($class, $value);
        }

        return $bindings;
    }

    /**
     * A minimal stand-in for the routed Route so `$request->route('name')` and
     * `$request->route()?->parameter('name')` resolve the bound models, exactly
     * as they would during a real request.
     *
     * @param  array<string, Model|null>  $bindings
     */
    private function makeRouteStub(array $bindings): object
    {
        return new class($bindings)
        {
            /** @param array<string, mixed> $parameters */
            public function __construct(private array $parameters) {}

            public function parameter(string $name, mixed $default = null): mixed
            {
                return $this->parameters[$name] ?? $default;
            }

            /** @return array<string, mixed> */
            public function parameters(): array
            {
                return $this->parameters;
            }

            public function uri(): string
            {
                return '';
            }

            public function __toString(): string
            {
                return '';
            }
        };
    }

    /**
     * @param  class-string<FormRequest>  $class
     */
    private function makeFormRequest(string $class, HttpRequest $request, object $user): FormRequest
    {
        /** @var FormRequest $formRequest */
        $formRequest = $class::createFrom($request);

        $formRequest->setContainer(app());
        $formRequest->setUserResolver(fn (): object => $user);
        $formRequest->setLaravelSession(app('session.store'));
        $formRequest->setRedirector(app('redirect'));

        // Triggers authorize() + the full rules() pipeline of the original form
        // request, throwing ValidationException / AuthorizationException on failure.
        $formRequest->validateResolved();

        return $formRequest;
    }

    /**
     * @param  class-string<Model>  $class
     */
    private function resolveModel(string $class, mixed $value): Model
    {
        /** @var Model $model */
        $model = new $class;

        if ($value === null || $value === '') {
            throw (new ModelNotFoundException)->setModel($class);
        }

        $resolved = $model->resolveRouteBinding($value);

        if (! $resolved) {
            throw (new ModelNotFoundException)->setModel($class, [$value]);
        }

        return $resolved;
    }

    /**
     * Translate whatever the controller returned into an MCP response.
     */
    private function translate(mixed $result, HttpRequest $request, SessionStore $session): McpResponse|ResponseFactory
    {
        if ($result instanceof InertiaResponse) {
            $response = $result->toResponse($request);

            $payload = json_decode((string) $response->getContent(), true) ?: [];

            $props = $payload['props'] ?? [];

            if ($props === []) {
                return McpResponse::text('The dashboard page returned no data.');
            }

            return McpResponse::structured($props);
        }

        if ($result instanceof RedirectResponse) {
            return $this->translateRedirect($result, $session);
        }

        if ($result instanceof JsonResponse) {
            $decoded = json_decode((string) $result->getContent(), true);

            return McpResponse::structured(is_array($decoded) && $decoded !== [] ? $decoded : ['response' => $decoded]);
        }

        if (is_object($result) && method_exists($result, 'getContent')) {
            $content = (string) $result->getContent();

            return $content === '' ? McpResponse::text('Done.') : McpResponse::text($content);
        }

        if (is_array($result)) {
            return McpResponse::structured($result === [] ? ['result' => null] : $result);
        }

        return McpResponse::text(is_scalar($result) ? (string) $result : 'Done.');
    }

    private function translateRedirect(RedirectResponse $result, SessionStore $session): McpResponse|ResponseFactory
    {
        $errors = $session->get('errors');

        if ($errors instanceof \Illuminate\Support\ViewErrorBag && $errors->any()) {
            $messages = [];

            foreach ($errors->getBags() as $bag) {
                $messages += $bag->toArray();
            }

            return McpResponse::structured([
                'status' => 'validation_failed',
                'errors' => $messages,
            ]);
        }

        $flashKeys = $session->get('_flash.new', []);
        $success = collect($flashKeys)
            ->mapWithKeys(fn (string $key): array => [$key => $session->get($key)])
            ->filter(fn ($value, $key): bool => ! in_array($key, ['_old_input', 'errors', '_token', '_flash.old', '_flash.new'], true))
            ->all();

        return McpResponse::structured([
            'status' => 'success',
            'redirect' => $result->getTargetUrl(),
            'messages' => $success === [] ? (object) [] : $success,
        ]);
    }
}
