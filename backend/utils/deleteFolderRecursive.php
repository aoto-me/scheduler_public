<?php

declare(strict_types=1);

/**
 * フォルダ内のファイル・サブフォルダを再帰的に削除する
 */
function deleteFolderRecursive(string $folderPath): void
{
    $files = array_diff(scandir($folderPath), ['.', '..']);

    foreach ($files as $file) {
        $filePath = $folderPath . '/' . $file;

        if (is_dir($filePath)) {
            deleteFolderRecursive($filePath);
        } else {
            if (!unlink($filePath)) {
                throw new HttpException("ファイル削除に失敗しました: {$filePath}", 500);
            }
        }
    }

    // rmdir は空フォルダしか削除できないため、最後に呼ぶ
    if (!rmdir($folderPath)) {
        throw new HttpException("フォルダ削除に失敗しました: {$folderPath}", 500);
    }
}
