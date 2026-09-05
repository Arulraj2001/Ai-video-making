from fastapi import Request, status
from fastapi.responses import JSONResponse

class AppException(Exception):
    def __init__(self, message: str, status_code: int = status.HTTP_400_BAD_REQUEST):
        self.message = message
        self.status_code = status_code
        super().__init__(message)

class NotFoundException(AppException):
    def __init__(self, message_or_resource: str, resource_id: str = ""):
        if resource_id:
            msg = f"{message_or_resource} '{resource_id}' not found"
        else:
            msg = message_or_resource
        super().__init__(msg, status_code=status.HTTP_404_NOT_FOUND)

class NotFoundError(NotFoundException):
    pass

class ValidationError(AppException):
    def __init__(self, message: str):
        super().__init__(message, status_code=status.HTTP_400_BAD_REQUEST)

async def app_exception_handler(request: Request, exc: AppException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": True, "message": exc.message, "status_code": exc.status_code}
    )

async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"error": True, "message": "An unexpected server error occurred", "details": str(exc)}
    )
