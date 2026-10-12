<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class UploadController extends Controller
{
    /**
     * Store an uploaded image or favicon and return its public URL.
     *
     * Kept as a standalone endpoint so the existing create/update controllers
     * can continue to validate cover/gallery/logo/favicon values as plain URLs.
     * Favicon `.ico` files are allowed alongside standard images.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'image' => [
                'required',
                'file',
                'max:5120',
                'mimetypes:image/*,image/vnd.microsoft.icon,image/x-icon,image/x-ico',
            ],
        ]);

        $path = $validated['image']->store('uploads', 'public');

        return response()->json([
            'url' => Storage::disk('public')->url($path),
            'path' => $path,
        ]);
    }
}
