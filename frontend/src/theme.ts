import { createTheme, MantineColorsTuple } from '@mantine/core'

// Traefik brand colors
const traefikBlue: MantineColorsTuple = [
  '#e7f9fb',
  '#c3f0f4',
  '#9ce6ed',
  '#74dce5',
  '#4dd2de',
  '#00aec1', // Main brand color
  '#009db0',
  '#008c9f',
  '#007b8e',
  '#006a7d'
]

const darkNavy: MantineColorsTuple = [
  '#f3f3f5',
  '#e5e5e8',
  '#c9cad1',
  '#adafbb',
  '#9295a4',
  '#767a8d',
  '#5f6377',
  '#474b60',
  '#2f3449',
  '#1a1c2e' // Dark background
]

export const theme = createTheme({
  colors: {
    traefikBlue,
    darkNavy,
    // Override default blue with Traefik blue
    blue: traefikBlue,
  },
  primaryColor: 'traefikBlue',
  defaultRadius: 'md',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
  headings: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
    fontWeight: '600',
  },
  components: {
    Card: {
      defaultProps: {
        shadow: 'sm',
        radius: 'md',
        withBorder: true,
      }
    },
    Button: {
      defaultProps: {
        radius: 'md',
      }
    },
    TextInput: {
      defaultProps: {
        radius: 'md',
      }
    },
    Table: {
      defaultProps: {
        striped: true,
        highlightOnHover: true,
        withTableBorder: true,
      }
    }
  }
})