import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';
import { providePrimeNG } from 'primeng/config';

export const AtlasBlue = definePreset(Aura, {
  components: { progressbar: { root: { height: '0.3125rem' } } },
  semantic: {
    primary: {
      50: '{blue.50}', 100: '{blue.100}', 200: '{blue.200}', 300: '{blue.300}',
      400: '{blue.400}', 500: '{blue.500}', 600: '{blue.600}', 700: '{blue.700}',
      800: '{blue.800}', 900: '{blue.900}', 950: '{blue.950}'
    }
  }
});

export function provideAtlasPrimeNG(license = '') {
  return providePrimeNG({
    license,
    theme: { preset: AtlasBlue, options: { darkModeSelector: false } }
  });
}
