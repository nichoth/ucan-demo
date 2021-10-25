import { render } from 'preact'
import { html } from 'htm/preact'

var el = html`<div>
    <ul class="user-list">
        ${['alice', 'bob', 'carol'].map(name => {
            return html`<${User} id=${1} name="${name}" />`
        })}
    </ul>
</div>`

function User ({ id, name }) {
    return html`<li class="user">${name} ${id}</li>`
}

render(el, document.getElementById('content'))
