<?php

namespace App\Controllers\Api;

use CodeIgniter\RESTful\ResourceController;
use App\Core\Response\ApiResponse;

abstract class BaseApiController extends ResourceController
{
    use ApiResponse;
}