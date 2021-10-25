import { render } from 'preact'
import { html } from 'htm/preact'
import { useState, useEffect } from 'preact/hooks'
import * as ucan from 'ucans'
// import { toString } from 'uint8arrays/to-string'


function TheApp () {
    // a list like
    // [ { name, keys } ]
    const [users, setUsers] = useState([])
    const [serverKey, setServerKey] = useState(null)
    const [serverUcan, setServerUcan] = useState(null)

    useEffect(() => {
        // we are keeping a keypair that the server uses to create
        // it's own ucan in this model
        // then all the users have a ucan derived from this one
        ucan.keypair.create(ucan.KeyType.Edwards)
            .then(async kp => {
                console.log('server keypair', kp, kp.did())
                setServerKey(kp)

                const u = await ucan.build({
                    audience: kp.did(), // recipient
                    issuer: kp, // signing key
                    capabilities: [ // permissions for ucan
                        {
                            "wnfs": "boris.fission.name/public/photos/",
                            "cap": "OVERWRITE"
                        },
                        {
                            "wnfs": "boris.fission.name/private/4tZA6S61BSXygmJGGW885odfQwpnR2UgmCaS5CfCuWtEKQdtkRnvKVdZ4q6wBXYTjhewomJWPL2ui3hJqaSodFnKyWiPZWLwzp1h7wLtaVBQqSW4ZFgyYaJScVkBs32BThn6BZBJTmayeoA9hm8XrhTX4CGX5CVCwqvEUvHTSzAwdaR",
                            "cap": "APPEND"
                        },
                        {
                            "email": "boris@fission.codes",
                            "cap": "SEND"
                        }
                    ]
                })

                console.log('server ucan', u)
                setServerUcan(u)
            })

    }, [])

    useEffect(() => {
        Promise.all(['alice', 'bob', 'carol'].map((username) => {
            return ucan.keypair.create(ucan.KeyType.Edwards)
                .then((kp) => ({ username, keys: kp }))
        }))
            .then(_users => setUsers(_users))
    }, [])

    console.log('users', users)

    // need to create a ucan for each user
    // iff they are a member 

    return html`<div>
        <h1>The country club</h1>
        <div class="the-club">
            <div class="server-info">
                <h2>server ID</h2>
                <pre>${serverKey && serverKey.did()}</pre>
                <h2>members</h2>
                <ul>
                    ${users.map(u => {
                        if (u.ucan) {
                            var isVal = ucan.isValid(u.ucan)
                        }
                    })}
                </ul>
            </div>
        </div>

        <h2>users</h2>
        <ul class="user-list">
            ${users.map((user) => {
                const { username, keys } = user
                if (!user.ucan) {
                    return html`<${User}
                        id=${keys && keys.did()}
                        username=${username}
                    />`
                }
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


function User (props) {
    const { id, username } = props
    return html`<li class="user">
        <div class="user-name">
            ${username}
        </div>
        <div class="user-id">
            ${id}
        </div>

        <div class="btns">
            <button>create invitation</button>
        </div>
    </li>`
}

render(html`<${TheApp} />`, document.getElementById('content'))
