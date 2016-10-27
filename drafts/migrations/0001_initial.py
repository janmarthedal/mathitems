# -*- coding: utf-8 -*-
# Generated by Django 1.10.1 on 2016-10-27 16:02
from __future__ import unicode_literals

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('mathitems', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='DraftItem',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('item_type', models.CharField(choices=[('D', 'Definition'), ('P', 'Proof'), ('T', 'Theorem')], max_length=1)),
                ('body', models.TextField(blank=True)),
                ('created_by', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
                ('parent', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, to='mathitems.MathItem')),
            ],
        ),
    ]
