# backend/api/views.py

from rest_framework import viewsets, generics, permissions, status
from rest_framework.response import Response as APIResponse
from .models import Survey, Response, User
from .serializers import (
    SurveySerializer, ResponseSerializer, 
    UserRegisterSerializer, LoginSerializer
)
from rest_framework.authtoken.models import Token

# --- AUTH VIEWLARI (Aynı kalabilir) ---
class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserRegisterSerializer
    permission_classes = [permissions.AllowAny]

class LoginView(generics.GenericAPIView):
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
            "email": user.email
        }, status=status.HTTP_200_OK)

# --- YENİ ANKET SİSTEMİ VIEWLARI ---

class SurveyViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Aktif anketleri listeler.
    Öğrenciler sadece görüntüleyebilir (ReadOnly).
    """
    queryset = Survey.objects.filter(is_active=True)
    serializer_class = SurveySerializer
    permission_classes = [permissions.IsAuthenticated] # Sadece giriş yapan görsün

class ResponseViewSet(viewsets.ModelViewSet):
    """
    Anket cevaplarını kaydeder.
    """
    queryset = Response.objects.all()
    serializer_class = ResponseSerializer
    permission_classes = [permissions.IsAuthenticated]

    # Sadece create (POST) işlemine izin verelim, öğrenciler başkasının cevabını görmesin
    http_method_names = ['post'] 

    def get_serializer_context(self):
        # Serializer'a 'request' bilgisini gönder ki user'ı alabilsin
        context = super().get_serializer_context()
        context.update({"request": self.request})
        return context