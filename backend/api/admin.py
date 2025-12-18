# backend/api/admin.py

from django.contrib import admin
from .models import Survey, Question, Response, Answer

class QuestionInline(admin.TabularInline):
    model = Question
    extra = 1

class SurveyAdmin(admin.ModelAdmin):
    list_display = ('title', 'is_active', 'created_at')
    inlines = [QuestionInline]

class AnswerInline(admin.TabularInline):
    model = Answer
    readonly_fields = ('question', 'value')
    extra = 0
    can_delete = False

class ResponseAdmin(admin.ModelAdmin):
    list_display = ('user', 'survey', 'submitted_at')
    inlines = [AnswerInline]
    readonly_fields = ('user', 'survey', 'submitted_at')

admin.site.register(Survey, SurveyAdmin)
admin.site.register(Response, ResponseAdmin)