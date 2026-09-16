/// <reference types="vitest/globals" />
import { mount } from '@vue/test-utils'
import App from '../../src/App.vue'

describe('App.vue', () => {
  it('monta y muestra el título', () => {
    const c = mount(App)
    expect(c.text()).toContain('pseudo-valido')
  })
})
