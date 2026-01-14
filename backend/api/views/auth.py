from rest_framework import generics, permissions, status
from rest_framework.response import Response as APIResponse
from rest_framework.authtoken.models import Token
from rest_framework.views import APIView
from django.core.mail import send_mail
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.conf import settings
import threading

from ..models import User
from ..serializers import UserRegisterSerializer, LoginSerializer

class RegisterView(generics.CreateAPIView):
    """
    API View for user registration.
    Allows any user to register a new account.
    """
    queryset = User.objects.all()
    serializer_class = UserRegisterSerializer
    permission_classes = [permissions.AllowAny]

class LoginView(generics.GenericAPIView):
    """
    API View for user authentication (Login).
    Returns an auth token and user profile details upon successful credentials.
    """
    permission_classes = [permissions.AllowAny]
    serializer_class = LoginSerializer
    
    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        token, created = Token.objects.get_or_create(user=user)
        
        return APIResponse({
            "token": token.key,
            "user_id": user.pk,
            "email": user.email,
            "username": user.username,
            "is_staff": user.is_staff,
            "is_superuser": user.is_superuser
        }, status=status.HTTP_200_OK)

class ChangePasswordView(APIView):
    """
    API View for authenticated users to change their own password.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        new_password = request.data.get('password')
        
        if not new_password:
            return APIResponse({'error': 'Password is required.'}, status=400)
        
        user.set_password(new_password)
        user.save()
        return APIResponse({'status': 'Your password has been changed.'})

class PasswordResetRequestView(APIView):
    """
    Step 1: User provides email.
    We generate a UID + Token and send a RESET LINK.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email')
        if not email:
            return APIResponse({'error': 'Please provide your email address.'}, status=400)

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return APIResponse({'status': 'If an account exists, a reset link has been sent.'})

        # 1. Generate Token & UID
        token = default_token_generator.make_token(user)
        uid = urlsafe_base64_encode(force_bytes(user.pk))

        # 2. Build Reset Link
        frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
        reset_link = f"{frontend_url}/reset-password/{uid}/{token}"

        # 3. Send Email
        def send_email_task(user_email, link):
            try:
                send_mail(
                    subject='Password Reset Request',
                    message=f'Click the link below to reset your password:\n\n{link}\n\nIf you did not request this, ignore this email.',
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[user_email],
                    fail_silently=False,
                )
            except Exception as e:
                print(f"Email Error: {e}")

        email_thread = threading.Thread(
            target=send_email_task,
            args=(user.email, reset_link)
        )
        email_thread.start()

        return APIResponse({'status': 'Password reset link sent to your email.'})


class PasswordResetConfirmView(APIView):
    """
    Step 2: User clicks link, enters NEW password.
    We validate UID + Token. If valid, set password.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        uid_b64 = request.data.get('uid')
        token = request.data.get('token')
        new_password = request.data.get('password')

        if not all([uid_b64, token, new_password]):
            return APIResponse({'error': 'Missing data.'}, status=400)

        try:
            uid = force_str(urlsafe_base64_decode(uid_b64))
            user = User.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            return APIResponse({'error': 'Invalid reset link.'}, status=400)

        if not default_token_generator.check_token(user, token):
            return APIResponse({'error': 'Invalid or expired reset token.'}, status=400)

        user.set_password(new_password)
        user.save()

        return APIResponse({'status': 'Password successfully reset. You can now login.'})
