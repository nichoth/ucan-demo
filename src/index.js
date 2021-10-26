import { render } from 'preact'
import { html } from 'htm/preact'
import { useState, useEffect } from 'preact/hooks'
import * as ucan from 'ucans'

function TheApp () {
    // a list like
    // [ { name, keys, ucan? } ]
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
        <p>
            The thing about country clubs is that you need to be invited by
            someone who is already a member.
        </p>

        <p>
            We are using an invitation code here. This code would be sent 
            to the server along with the new user's DID. The server can then
            create a UCAN for this DID. Here we are using a server-owned UCAN 
            as the 'parent' for the new UCAN we are creating. But in real-life
            it could be better to just keep a list of DIDs that are allowed
            to use this server. That way you don't have to store a keypair
            for this server anywhere (it's always better to not risk losing 
            a key because you don't even have a key.)
        </p>

        <p>
            Creating an invitation code is nice because it could be just
            emailed to a new user and placed in a query parameter in a link
            that the new user clicks on. It seems like you would want to use 
            the UCAN of the user that is inviting a new user as the 'proof' 
            field in a new UCAN, however that's more difficult because the 
            existing user would need to know a DID for the new user, and we 
            have no way of doing that since the new user may have never
            visited this website before, and we don't want the server to ever
            be able to see the private key of a new user.
        </p>

        <p>
            UCANs allow you to use an existing UCAN as 'proof' for the new 
            UCAN you are creating. That means that the child UCAN can only
            have permissions that are equal or lesser than the parent UCAN.
            So the 'capabilities' key must have a subset of the parent; it 
            can't have anything not in the parent.
        </p>

        <hr />

        <p>
            In real life, you could choose to keep invitation codes hashed
            with <code>bcrypt</code> in a JSON file in the repo, that way
            they would be usable in a serverless setting without needing
            to call a database. However, in this mode only the server 
            operator would be able to add new invitation codes. We might
            want anyone who is already a member to be able to create
            invitations. In that case you would want to create a random code
            and then hash it and save the hash to a database.
        </p>

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
                        return html`<li class="user">
                            <${User}
                                username=${u.username}
                                id=${u.keys && u.keys.did()}
                                ucan=${u.ucan}
                            />
                        </li>`
                    })}
                </ul>
            </div>
        </div>

        <p>
            This is all running in client-side JS, but not that there is 
            no shared state between the 'User' components and the
            'member list' above. Each 'User' component is able to
            independently verify its state as valid/invalid.
        </p>

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
    var [valid, setValid] = useState(null)
    if (props.ucan) {
        ucan.isValid(props.ucan).then(val => setValid(val))
    }

    function redeemInv (ev) {
        ev.preventDefault()
        var invCode = ev.target.elements.invitation.value
        props.redeemInvitation({ code: invCode, id })
    }

    var invalidMember = props.ucan && !valid
    console.log('inv member', invalidMember)

    return html`<div>
        <div class="user-name">
            ${
                props.ucan ?
                    (valid ? ('✅ ' + username) : ('❌ ' + username)) :
                    username
            }
        </div>

        ${invalidMember ?
            html`<p>
                This member is not valid
                <pre>${JSON.stringify(props.ucan, null, 2)}</pre>
            </p>` :
            null
        }

        <div class="user-id">
            ${id}
        </div>

        ${!props.ucan ?
            html`<div class="btns">
                <form onSubmit=${redeemInv}>
                    <input name="invitation" type="text" />
                    <button type="submit">redeem invitation</button>
                </form>
                <p>
                    Enter an invitation code from above. Or enter the
                    word <code>'bad'</code>, which will create a UCAN
                    with invalid capabilities, to simulate the situation
                    of creating a UCAN with greater priviledges than the
                    'parent' UCAN that issued the permissions.
                </p>
            </div>` :
            null
        }
    </div>`
}

render(html`<${TheApp} />`, document.getElementById('content'))
