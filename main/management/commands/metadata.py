from django.core.management.base import BaseCommand

from concepts.models import Concept, ConceptDefinition, ConceptReference, ItemDependency
from equations.models import ItemEquation
from main.item_helpers import create_item_meta_data, create_concept_meta
from mathitems.models import MathItem
from media.models import ItemMediaDependency


class Command(BaseCommand):
    help = 'Recreate metadata'

    def handle(self, *args, **options):
        self.stdout.write('Cleaning meta tables')
        ConceptDefinition.objects.all().delete()
        ConceptReference.objects.all().delete()
        ItemDependency.objects.all().delete()
        ItemMediaDependency.objects.all().delete()
        ItemEquation.objects.all().delete()

        self.stdout.write('Looping through math items')
        self.stdout.ending = ''
        for item in MathItem.objects.all():
            self.stdout.write('{} '.format(item.get_name()))
            create_item_meta_data(item)
        self.stdout.ending = '\n'

        self.stdout.write('\nLooping through concepts')
        for concept in Concept.objects.all():
            create_concept_meta(concept.id)

        self.stdout.write(self.style.SUCCESS('Done'))
