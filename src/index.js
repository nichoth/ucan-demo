import { render } from 'preact'
import { html } from 'htm/preact'
import { useState, useEffect } from 'preact/hooks'
import * as ucan from 'ucans'

function TheApp () {
    // a list like
    // [ { name, keys } ]
    var [users, setUsers] = useState([])

    useEffect(() => {
        Promise.all(['alice', 'bob', 'carol'].map((name) => {
            return ucan.keypair.create(ucan.KeyType.Edwards)
                .then((kp) => ({ name, keys: kp }))
        }))
            .then(_users => setUsers(_users))
    }, [])

    return html`<div>
        <h1>The country club</h1>

        <h2>users</h2>
        <ul class="user-list">
            ${users.map(({ name, keys }) => {
                return html`<${User}
                    id=${keys && keys.did()}
                    name="${name}"
                />`
            })}
        </ul>
    </div>`
}


// create an invitation is like
// * alice is a member
// * alice creates an invitation
// * bob asks to redeem the invitation -- sends a message with an invitation
//   and also bob's DID
// * server says, 'yes this invitation is ok. i will create a UCAN for you
//    by using my private key'
// * bob recieves the UCAN and saves it
// * on bob requests, the server needs to check their UCAN and verify that
//    at the root it was signed with the server keys


function User ({ id, name }) {
    return html`<li class="user">${name} -- ${id}</li>`
}

render(html`<${TheApp} />`, document.getElementById('content'))
