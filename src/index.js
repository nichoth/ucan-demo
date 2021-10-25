import { render } from 'preact'
import { html } from 'htm/preact'

var el = html`<div>the app</div>`

render(el, document.getElementById('content'))
