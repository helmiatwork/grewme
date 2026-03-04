package com.grewme.parent.data.api

sealed class AppException(message: String, cause: Throwable? = null) : Exception(message, cause)
class AuthException(message: String) : AppException(message)
class ForbiddenException(message: String) : AppException(message)
class NotFoundException(message: String) : AppException(message)
class ApiException(message: String) : AppException(message)
class NetworkException(message: String, cause: Throwable) : AppException(message, cause)
