<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use App\Http\Requests\Dashboard\StoreBookPdfRequest;
use App\Http\Requests\Dashboard\StoreUploadRequest;
use App\Services\PdfThumbnailService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class UploadController extends Controller
{
    public function __construct(private readonly PdfThumbnailService $thumbnails)
    {
    }

    /**
     * Store an uploaded image or favicon and return its public URL.
     *
     * Kept as a standalone endpoint so the existing create/update controllers
     * can continue to validate cover/gallery/logo/favicon values as plain URLs.
     * Favicon `.ico` files are allowed alongside standard images.
     */
    public function store(StoreUploadRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $path = $validated['image']->store('uploads', 'public');

        // Return an app-relative URL (e.g. /storage/uploads/x.jpg) instead of an
        // APP_URL-based absolute one, so the asset resolves correctly no matter
        // which host, port or scheme the site is being served from.
        $absolute = Storage::disk('public')->url($path);
        $url = '/'.ltrim((string) parse_url($absolute, PHP_URL_PATH), '/');

        return response()->json([
            'url' => $url,
            'path' => $path,
        ]);
    }

    /**
     * Store a book PDF and render its first page into a thumbnail.
     *
     * Returns the stored paths plus public URLs so the book form can submit
     * them as hidden fields (mirroring the image uploader) rather than sending
     * a second multipart request when the book is saved.
     */
    public function pdf(StoreBookPdfRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $path = $validated['file']->store('books/pdfs', 'public');

        $thumbnailPath = $this->thumbnails->generate(
            $path,
            'books/thumbs/'.Str::random(20).'.png',
        );

        return response()->json([
            'path' => $path,
            'url' => Storage::disk('public')->url($path),
            'thumbnail_path' => $thumbnailPath,
            'thumbnail_url' => $this->thumbnails->url($thumbnailPath),
        ]);
    }
}
