# backend/api/models.py
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.conf import settings # Ayarlardan AUTH_USER_MODEL'i çekmek için

class User(AbstractUser):
    ROLE_CHOICES = (
        ('student', 'Student'),
        ('admin', 'Admin'),
    )
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='student')

    full_name = models.CharField(max_length=255, blank=True)
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    def __str__(self):
        return self.email

class Meal(models.Model):
    """
    Sistemdeki tüm yemeklerin ana listesi (Tasarım Belgesi - Tablo 2)
    """
    name = models.CharField(max_length=255, unique=True)
    category = models.CharField(max_length=100, null=True, blank=True) # Opsiyonel 
    calories = models.PositiveIntegerField()
    allergens = models.TextField(blank=True) # Alerjen bilgisi boş olabilir
    
    # Bir yemeği hangi adminin oluşturduğunu bilmek iyi bir veridir.
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, # Admin silinirse yemek kalsın
        null=True,
        limit_choices_to={'role': 'admin'} # Sadece adminler oluşturabilsin
    )

    def __str__(self):
        return self.name

class Menu(models.Model):
    """
    Hangi tarihte menü olduğunu belirtir (Tasarım Belgesi - Tablo 3)
    """
    date = models.DateField(unique=True) # Bir tarihte sadece bir menü olabilir

    meals = models.ManyToManyField(
        Meal, 
        through='MenuMeal',  # Hangi ara tabloyu kullanacağını belirtiyoruz
        related_name='menus' # Bir yemeğin hangi menülerde olduğunu bulmak için
    )

    def __str__(self):
        return str(self.date)

class MenuMeal(models.Model):
    """
    Hangi menüde hangi yemeklerin olduğunu bağlayan Ara Tablo (Tasarım Belgesi - Tablo 4)
    """
    menu = models.ForeignKey(Menu, on_delete=models.CASCADE)
    meal = models.ForeignKey(Meal, on_delete=models.CASCADE)

    class Meta:
        # Bir menüde bir yemek sadece bir kez olabilir
        unique_together = ('menu', 'meal') 

    def __str__(self):
        return f"{self.menu.date} - {self.meal.name}"

class MealRating(models.Model):
    """
    Öğrencinin yemeğe verdiği 1-5 yıldız puanı (Tasarım Belgesi - Tablo 5)
    """
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    meal = models.ForeignKey(Meal, on_delete=models.CASCADE)
    score = models.PositiveSmallIntegerField() # 1-5 arası için en verimli tip

    class Meta:
        # Bir öğrenci bir yemeği sadece bir kez oylayabilir
        unique_together = ('user', 'meal')

    def __str__(self):
        return f"{self.user.email} -> {self.meal.name}: {self.score} Yıldız"

class MenuLike(models.Model):
    """
    Öğrencinin günün menüsünü beğenmesi (Kalp) (Tasarım Belgesi - Tablo 6)
    """
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    menu = models.ForeignKey(Menu, on_delete=models.CASCADE)

    class Meta:
        # Bir öğrenci bir menüyü sadece bir kez beğenebilir
        unique_together = ('user', 'menu')

    def __str__(self):
        return f"{self.user.email} -> {self.menu.date} Beğendi"

class SurveyAnswer(models.Model):
    """
    Yemekle ilgili 3 statik anket sorusunun cevabı (Tasarım Belgesi - Tablo 7)
    """
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    meal = models.ForeignKey(Meal, on_delete=models.CASCADE)
    
    # 1-5 (Katılmıyorum/Katılıyorum) arası Likert skalası
    q_portion = models.PositiveSmallIntegerField() # Porsiyon yeterliydi
    q_taste = models.PositiveSmallIntegerField()   # Yemek lezzetliydi
    q_cleanliness = models.PositiveSmallIntegerField() # Temizlik yeterliydi

    class Meta:
        # Bir öğrenci bir yemeğe sadece bir kez anket doldurabilir
        unique_together = ('user', 'meal')

    def __str__(self):
        return f"Anket: {self.user.email} -> {self.meal.name}"