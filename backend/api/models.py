from django.db import models
from django.contrib.auth.models import User

# 1. ANKET (SURVEY): Genel anket başlığı (Örn: "2 Kasım Yemek Menüsü", "Bahar Konferansı")
class Survey(models.Model):
    title = models.CharField(max_length=200, verbose_name="Anket Başlığı")
    description = models.TextField(blank=True, verbose_name="Açıklama")
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True, verbose_name="Aktif mi?")

    def __str__(self):
        return self.title

# 2. SORU (QUESTION): Ankete bağlı dinamik sorular
class Question(models.Model):
    QUESTION_TYPES = [
        ('text', 'Kısa Metin'),
        ('star', 'Yıldız Puanlama'),
        ('choice', 'Tek Seçim (Radio)'),
        # YENİ TİPLER EKLENDİ 👇
        ('multiple', 'Çoklu Seçim (Checkbox)'), 
        ('date', 'Tarih Seçimi'),
        ('scale', '1-10 Ölçek'), 
    ]

    survey = models.ForeignKey(Survey, related_name='questions', on_delete=models.CASCADE)
    text = models.CharField(max_length=255)
    question_type = models.CharField(max_length=20, choices=QUESTION_TYPES, default='text')
    options = models.TextField(blank=True, null=True, help_text="Seçenekleri virgülle ayırın")
    order = models.IntegerField(default=1)
    page_number = models.IntegerField(default=1, verbose_name="Sayfa Numarası")
    required = models.BooleanField(default=True, verbose_name="Zorunlu Soru")

    def __str__(self):
        return f"{self.text} ({self.get_question_type_display()})"

# 3. CEVAP PAKETİ (RESPONSE): Bir öğrencinin bir ankete gönderdiği formun bütünü
class Response(models.Model):
    survey = models.ForeignKey(Survey, related_name='responses', on_delete=models.CASCADE)
    user = models.ForeignKey(User, related_name='responses', on_delete=models.CASCADE)
    submitted_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.survey.title}"

# 4. TEKİL CEVAP (ANSWER): Her bir soruya verilen spesifik cevap
class Answer(models.Model):
    response = models.ForeignKey(Response, related_name='answers', on_delete=models.CASCADE)
    question = models.ForeignKey(Question, related_name='answers', on_delete=models.CASCADE)
    
    # Cevabı metin olarak tutacağız. Sayı da gelse, yazı da gelse buraya sığar.
    # Senior notu: Büyük projelerde bu alan JSONField yapılır ama şu an CharField yeterli.
    value = models.TextField(verbose_name="Cevap Değeri")

    def __str__(self):
        return f"{self.question.text}: {self.value}"