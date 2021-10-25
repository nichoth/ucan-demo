import { render } from 'preact'
import { html } from 'htm/preact'
import { useState, useEffect } from 'preact/hooks'
import * as ucan from 'ucans'

const users = ['alice', 'bob', 'carol']

function TheApp () {
    var [keys, setKeys] = useState([])
    useEffect(() => {
        Promise.all(users.map(() => {
            return ucan.keypair.create(ucan.KeyType.Edwards)
        }))
            .then(_keys => setKeys(_keys))
    }, [])

    return html`<div>
        <ul class="user-list">
            ${users.map((name, i) => {
                return html`<${User}
                    id=${keys[i] && keys[i].did()}
                    name="${name}"
                />`
            })}
        </ul>
    </div>`
}


function User ({ id, name }) {
    return html`<li class="user">${name} -- ${id}</li>`
}

render(html`<${TheApp} />`, document.getElementById('content'))
