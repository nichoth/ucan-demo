import { render } from 'preact'
import { html } from 'htm/preact'
import { useState, useEffect } from 'preact/hooks'
import * as ucan from 'ucans'
import { isValid } from 'ucans'
// import { toString } from 'uint8arrays/to-string'
// import { fromString, toString } from 'uint8arrays'

function TheApp () {
    // a list like
    // [ { name, keys } ]
    const [users, setUsers] = useState([])
    const [serverKey, setServerKey] = useState(null)
    const [serverUcan, setServerUcan] = useState(null)
    const [serverInvitations, setServerInvitations] = useState([])

    useEffect(() => {
        // we are keeping a keypair that the server uses to create
        // it's own ucan in this model
        // then all the users have a ucan derived from this one
        ucan.keypair.create(ucan.KeyType.Edwards)
            .then(async kp => {
                console.log('server keypair', kp)
                console.log('server did', kp.did())
                setServerKey(kp)

                const u = await ucan.build({
                    audience: kp.did(), // recipient
                    issuer: kp, // signing key
                    capabilities: [ // permissions for ucan
                        {
                            "country-club": "country-club",
                            "cap": "member"
                        },
                        {
                            // what is this? (the `wnfs` key)
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

    console.log('render -- ', 'users', users)

    // need to create a ucan for each user
    // iff they are a member 

    // here the user needs to submit their DID and also the invitation code
    function submitInv ({ code, id }) {
        if (code === 'bad') {
            return Promise.all(users.map(async user => {
                if (user.keys.did() !== id) return Promise.resolve(user)

                return ucan.build({
                    audience: user.keys.did(),
                    issuer: serverKey,
                    capabilities: [{
                        foo: 'barrr'
                    }],
                    proof: ucan.encode(serverUcan)
                })
                    .then(_ucan => {
                        user.ucan = _ucan
                        return user
                    })
            })).then(users => setUsers(users))
        }

        // check that the invitation code is valid
        if (!serverInvitations.includes(code)) return

        // in here we create a ucan for the given user
        Promise.all(
            users.map(async user => {
                // only change the user this invitation is being submitted by
                if (user.keys.did() !== id) return Promise.resolve(user)

                return ucan.build({
                    audience: user.keys.did(),
                    issuer: serverKey, // signing key
                    capabilities: [ // permissions for ucan
                        {
                            "country-club": "country-club", // what is this?
                            "cap": "member"
                        }
                    ],
                    proof: ucan.encode(serverUcan)
                })
                    .then(ucan => {
                        user.ucan = ucan
                        return user
                    })
            })
        )
            .then(users => {
                setUsers(users)
            })
    }

    // in real life these could be random strings that are hashed with
    // `bcrypt` and saved in a DB
    function createInv (ev) {
        ev.preventDefault()
        var inv = Math.random().toString(36).slice(2)
        setServerInvitations(serverInvitations.concat([inv]))
    }

    return html`<div>
        <h1>The country club</h1>
        <div class="the-club">
            <div class="server-info">
                <h2>server ID</h2>
                <pre>${serverKey && serverKey.did()}</pre>

                <h2>invitations</h2>
                <button onclick="${createInv}">create an invitation</button>
                <ul>
                    ${serverInvitations.map(inv => {
                        return html`<li>${inv}</li>`
                    })}
                </ul>

                <h2>members</h2>
                <ul class="member-list">
                    ${users.map(u => {
                        if (!u.ucan) return null
                        var isVal = ucan.isValid(u.ucan)
                        return html`<li class="user">
                            <${User}
                                isValid=${isVal}
                                username=${u.username}
                                id=${u.keys && u.keys.did()}
                                ucan=${u.ucan}
                            />
                        </li>`
                    })}
                </ul>
            </div>
        </div>

        <h2>users</h2>
        <ul class="user-list">
            ${users.map((user) => {
                if (user.ucan) return null
                const { username, keys } = user
                if (!user.ucan) {
                    return html`<li class="user"><${User}
                        id=${keys && keys.did()}
                        username=${username}
                        redeemInvitation=${submitInv}
                    /></li>`
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
    var isMember = props.ucan
    var isValid = (props.ucan && ucan.isValid(props.ucan))

    var [valid, setValid] = useState(null)

    if (isValid) isValid.then(val => setValid(val))

    function redeemInv (ev) {
        ev.preventDefault()
        var invCode = ev.target.elements.invitation.value
        props.redeemInvitation({ code: invCode, id })
    }

    return html`<div>
        <div class="user-name">
            ${(isMember && valid) ?
                ('✅ ' + username) :
                (isMember && !valid) ? '❌ ' + username : username
            }
        </div>
        <div class="user-id">
            ${id}
        </div>

        ${!isMember ?
            html`<div class="btns">
                <form onSubmit=${redeemInv}>
                    <input name="invitation" type="text" />
                    <button type="submit">redeem invitation</button>
                </form>
            </div>` :
            null
        }
    </div>`
}

render(html`<${TheApp} />`, document.getElementById('content'))
