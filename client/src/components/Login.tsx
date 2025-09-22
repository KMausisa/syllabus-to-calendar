import React from "react"

export default function Login({url}: {url: string}) {
    return (
        <div className="login-page">
            <h1>Private Google Calendar</h1>
            <a href={`${url}/auth/google`}>Sign in with Google</a>
        </div>
    )
}