<?php

declare(strict_types=1);

namespace App\Mcp\Tools;

use App\Mcp\Support\DashboardDispatcher;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\ResponseFactory;
use Laravel\Mcp\Server\Tool;

/**
 * A thin, declarative MCP tool that forwards to an existing dashboard controller
 * action through {@see DashboardDispatcher}. Concrete tools only describe *what*
 * to call — never how to do it — so the dashboard's controllers and services stay
 * the single source of truth for behaviour and authorization.
 */
abstract class DashboardTool extends Tool
{
    /**
     * The dashboard controller whose action this tool exposes.
     *
     * @var class-string
     */
    protected string $controller;

    /**
     * The controller method to invoke.
     */
    protected string $action;

    /**
     * The HTTP verb the underlying route uses (GET reads, POST/PUT/PATCH/DELETE writes).
     */
    protected string $verb = 'GET';

    /**
     * Argument names that are route-model bindings rather than payload/query fields.
     *
     * @var array<int, string>
     */
    protected array $models = [];

    public function __construct(protected DashboardDispatcher $dispatcher) {}

    public function handle(Request $request): Response|ResponseFactory
    {
        return $this->dispatcher->run($request, $this->controller, $this->action, $this->verb, $this->models);
    }
}
