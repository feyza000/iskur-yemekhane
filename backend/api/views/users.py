from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response as APIResponse
from rest_framework.exceptions import PermissionDenied

from ..models import User
from ..serializers import UserAdminSerializer

class UserViewSet(viewsets.ModelViewSet):
    """
    ViewSet for User management (Admin only).
    """
    queryset = User.objects.all().order_by('-date_joined')
    serializer_class = UserAdminSerializer
    permission_classes = [permissions.IsAdminUser]

    def perform_destroy(self, instance):
        request_user = self.request.user
        if instance.is_superuser and not request_user.is_superuser:
             raise PermissionDenied("Only a Superuser can delete another Superuser.")
        instance.delete()

    @action(detail=True, methods=['post'])
    def reset_password(self, request, pk=None):
        """
        Admin action to manually reset a user's password.
        """
        user = self.get_object()
        new_pass = request.data.get('password')
        if not new_pass:
            return APIResponse({'error': 'Password not provided.'}, status=400)
        
        user.set_password(new_pass)
        user.save()
        return APIResponse({'status': 'Password successfully updated.'})
