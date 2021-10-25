import { render } from 'preact'
import { html } from 'htm/preact'
import * as ucan from 'ucans'

console.log('ucan', ucan)
console.log('ucan keytype', ucan.KeyType)

const users = ['alice', 'bob', 'carol']
var keyPairs = users.map(() => {
    return ucan.keypair.create(ucan.KeyType.Edwards)
})

function TheApp () {
    return html`<div>
        <ul class="user-list">
            ${users.map((name, i) => {
                return html`<${User} id=${keyPairs[i]} name="${name}" />`
            })}
        </ul>
    </div>`
}


function User ({ id, name }) {
    return html`<li class="user">${name} ${id}</li>`
}

render(html`<${TheApp} />`, document.getElementById('content'))
