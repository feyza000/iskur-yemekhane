from django.db import models
from django.contrib.auth.models import User

# 1. SURVEY: General survey title (e.g. "Nov 2 Lunch Menu", "Spring Conference")
class Survey(models.Model):
    title = models.CharField(max_length=200, verbose_name="Anket Başlığı")
    description = models.TextField(blank=True, verbose_name="Açıklama")
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True, verbose_name="Aktif mi?")

    def __str__(self):
        return self.title

# 2. QUESTION: Dynamic questions linked to a survey
class Question(models.Model):
    QUESTION_TYPES = [
        ('text', 'Kısa Metin'),
        ('star', 'Yıldız Puanlama'),
        ('choice', 'Tek Seçim (Radio)'),
        ('multiple', 'Çoklu Seçim (Checkbox)'), 
        ('date', 'Tarih Seçimi'),
        ('scale', '1-10 Ölçek'), 
    ]

    survey = models.ForeignKey(Survey, related_name='questions', on_delete=models.CASCADE)
    text = models.CharField(max_length=255)
    question_type = models.CharField(max_length=20, choices=QUESTION_TYPES, default='text')
    # TextField -> JSONField conversion. Options will now be stored as ['A', 'B'].
    options = models.JSONField(blank=True, null=True, help_text="Seçenekler listesi")
    order = models.IntegerField(default=1)
    page_number = models.IntegerField(default=1, verbose_name="Sayfa Numarası")
    required = models.BooleanField(default=True, verbose_name="Zorunlu Soru")

    def __str__(self):
        return f"{self.text} ({self.get_question_type_display()})"

# 3. RESPONSE PACKAGE: The entire form submitted by a student for a survey
class Response(models.Model):
    survey = models.ForeignKey(Survey, related_name='responses', on_delete=models.CASCADE)
    # Keep answers even if user is deleted (SET_NULL to preserve statistics)
    user = models.ForeignKey(User, related_name='responses', on_delete=models.SET_NULL, null=True)
    submitted_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.survey.title}"

# 4. INDIVIDUAL ANSWER: Specific answer given to a question
class Answer(models.Model):
    response = models.ForeignKey(Response, related_name='answers', on_delete=models.CASCADE)
    question = models.ForeignKey(Question, related_name='answers', on_delete=models.CASCADE)
    
    # We will store the answer as text. It fits both numbers and text.
    # Senior Note: In larger projects this should be a JSONField, but CharField is sufficient for now.
    value = models.TextField(verbose_name="Cevap Değeri")

    def __str__(self):
        return f"{self.question.text}: {self.value}"