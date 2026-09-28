class DomainError(Exception):
    def __init__(self, code: str, message: str, status: int = 400):
        self.code = code
        self.message = message
        self.status = status
class NotFound(DomainError):
    def __init__(self, message: str = "Not found"):
        super().__init__("not_found", message, 404)
class Forbidden(DomainError):
    def __init__(self, message: str = "Forbidden"):
        super().__init__("forbidden", message, 403)
class Unauthorized(DomainError):
    def __init__(self, message: str = "Unauthorized"):
        super().__init__("unauthorized", message, 401)
