from rest_framework import serializers
from .models import Meal, Menu, User # İhtiyacımız olan modelleri import et

class MealSerializer(serializers.ModelSerializer):
    """
    Meal (Yemek) modelini JSON'a çevirir.
    """
    class Meta:
        model = Meal
        # Hangi alanların JSON'da görüneceğini seçiyoruz
        fields = ['id', 'name', 'category', 'calories', 'allergens']


class MenuSerializer(serializers.ModelSerializer):
    """
    Menu (Menü) modelini ve *içindeki yemekleri* JSON'a çevirir.
    """

    # "meals" alanı, bizim ModelSerializer'ımıza bağlıdır.
    # DRF, "meals" alanını otomatik olarak tanır ve MealSerializer'ı kullanır.
    # Biz sadece "iç içe" (nested) gösterim istiyoruz.
    meals = MealSerializer(many=True, read_only=True) # many=True -> birden fazla yemek var

    class Meta:
        model = Menu
        # "date" alanı Menü'den, "meals" alanı ilişkiden gelecek
        fields = ['id', 'date', 'meals']

class UserRegisterSerializer(serializers.ModelSerializer):
    """
    Yeni kullanıcı (öğrenci) kaydı için Serializer.
    """
    # 'password' alanı, API'den JSON olarak gelmeli (write_only)
    # ama API'den JSON olarak geri DÖNMEMELİ (read_only olmaz!).
    password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})

    class Meta:
        model = User
        fields = ('email', 'username', 'password', 'full_name') # Kayıt için bu alanlar gerekli
    
    def validate_email(self, email):
        """
        Gereksinim 1: E-postanın '@okul.edu.tr' ile bitmesini zorunlu kıl.
        """
        if not email.endswith('@ozal.edu.tr'):
            raise serializers.ValidationError("Sadece okul e-posta adresleri ile kayıt olunabilir.")
        return email

    def create(self, validated_data):
        """
        Kullanıcı oluşturulurken şifrenin "hash"lenmesi (şifrelenmesi) gerekir.
        Bu "create" metodunu override ederek (ezerek) bunu sağlıyoruz.
        """
        user = User.objects.create_user(
            email=validated_data['email'],
            username=validated_data['username'],
            password=validated_data['password'],
            full_name=validated_data.get('full_name', ''),
            role='student'  # Gereksinim 2: Kayıt olan herkes 'student' rolündedir.
        )
        return user