package com.grewme.parent.data.local.token

import platform.Foundation.NSUserDefaults

actual class TokenStorage {
    private val defaults = NSUserDefaults.standardUserDefaults

    actual fun saveTokens(accessToken: String, refreshToken: String) {
        defaults.setObject(accessToken, forKey = KEY_ACCESS)
        defaults.setObject(refreshToken, forKey = KEY_REFRESH)
    }

    actual fun getAccessToken(): String? =
        defaults.stringForKey(KEY_ACCESS)

    actual fun getRefreshToken(): String? =
        defaults.stringForKey(KEY_REFRESH)

    actual fun clearTokens() {
        defaults.removeObjectForKey(KEY_ACCESS)
        defaults.removeObjectForKey(KEY_REFRESH)
    }

    companion object {
        private const val KEY_ACCESS = "grewme_access_token"
        private const val KEY_REFRESH = "grewme_refresh_token"
    }
}
