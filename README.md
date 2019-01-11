# SiteHashPW

A hash based password manager that generates unique passwords per website
instead of storing them in a database.

Given a site's domain of origin and a master password, this password manager
computes a unique password per site. That way, the master password is not
exposed to the sites, and you neither have to store nor remember all the
per-site passwords.

Features include:

*   Two hash functions to choose from: Argon2id (secure, with 3 sets of
    parameters) and HMAC-SHA-256 (fast).
*   Support for two master passwords to allow migrating all sites to a new
    master password. Master passwords are never synced.
*   Master password can be stored in the local browser, or asked once per
    session.
*   Storage and sync of per-site parameters, including site-specific password
    length, generation and hash function.

## Building

```
git submodule update --init --remote
./pack.sh
```

## Installing

After building:

*   Either load the directory as unpacked extension into Chrome.
*   Or just view the included `index.html` in a browser. You may host it on your
    web server, but never use a version hosted by someone else, as there is no
    way for you to ensure integrity of a hosted version!

## License

See the [license file](LICENSE).
