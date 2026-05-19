<?php

namespace App\Core\Response;

/*
 * Cara menggunakan
 *
 
 use App\Core\Response\ApiStatus;

 return $this->errorResponse(
    'Unauthorized',
    [],
    ApiStatus::UNAUTHORIZED
 );
 
 */

class ApiStatus
{
    public const OK                  = 200;
    public const CREATED             = 201;

    public const BAD_REQUEST         = 400;
    public const UNAUTHORIZED        = 401;
    public const FORBIDDEN           = 403;
    public const NOT_FOUND           = 404;
    public const VALIDATION_ERROR    = 422;

    public const INTERNAL_ERROR      = 500;

    public const TOO_MANY_REQUESTS   = 429;
}