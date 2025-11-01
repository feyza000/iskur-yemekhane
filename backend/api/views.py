from rest_framework.authtoken.models import Token
from rest_framework.response import Response
from rest_framework import status
from rest_framework import viewsets, permissions, generics
from .models import Menu, Meal, MealRating, MenuLike, SurveyAnswer, User
from .serializers import (
    MenuSerializer, MealSerializer, UserRegisterSerializer, LoginSerializer
)

# TODO (Diğer modeller ve serializer'lar da eklenecek)

class MenuViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Tüm Menüleri ve tekil bir Menüyü görüntülemek için API endpoint'i.

    ReadOnlyModelViewSet: Sadece 'list' (listeleme) ve 'retrieve' (tekil getirme)
    aksiyonlarını otomatik olarak sağlar. 
    Bizim React uygulamamızın yeni menü oluşturmasına (POST) gerek yok,
    çünkü bunu admin paneli yapıyor. Bu, 'En Az Ayrıcalık İlkesi'dir.
    """
    queryset = Menu.objects.all().order_by('-date') # En yeni menüler en üstte gelsin
    serializer_class = MenuSerializer

class MealViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Tüm Yemekleri ve tekil bir Yemeği görüntülemek için API endpoint'i.
    """
    queryset = Meal.objects.all()
    serializer_class = MealSerializer

class RegisterView(generics.ListCreateAPIView):
    """
    Yeni kullanıcı kaydı (sadece POST) için API endpoint'i.
    """
    queryset = User.objects.all()
    serializer_class = UserRegisterSerializer
    # Kimlik doğrulaması olmayan (anonim) kullanıcıların
    # bu endpoint'e erişebilmesi için izin veriyoruz.
    permission_classes = [permissions.AllowAny]

class LoginView(generics.GenericAPIView):
    """
    E-posta ve şifre ile giriş yaparak jeton (token) döndürür.
    """
    permission_classes = [permissions.AllowAny]
    serializer_class = LoginSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        # Serializer'daki 'validate' metodunu çalıştır
        serializer.is_valid(raise_exception=True)
        
        # 'validate' metodu başarılıysa, 'user' objesini buradan al
        user = serializer.validated_data['user']
        
        # Kullanıcı için bir jeton al veya oluştur
        token, created = Token.objects.get_or_create(user=user)
        
        # Jetonu JSON olarak döndür
        return Response({
            "token": token.key,
            "user_id": user.pk,
            "email": user.email
        }, status=status.HTTP_200_OK)

# TODO BURAYA OYLAMA (MealRating, MenuLike, SurveyAnswer) İÇİN
# ViewSet'LER GELECEK (sonraki adımlarda)