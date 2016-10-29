# -*- coding: utf-8 -*-
# Generated by Django 1.10.1 on 2016-10-29 13:31
from __future__ import unicode_literals

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='MathItem',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('item_type', models.CharField(choices=[('D', 'Definition'), ('P', 'Proof'), ('T', 'Theorem')], max_length=1)),
                ('body', models.TextField()),
                ('created_by', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
                ('parent', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, to='mathitems.MathItem')),
            ],
            options={
                'db_table': 'mathitems',
            },
        ),
    ]
