# A Firefox extenstion supports sql like query for djadmin.


## Usage

- Press `Ctrl + k` to show pop up
- Press `Enter` to execute command

```shell
# open table  
from octosells.users

# query with conditions
from octosells.users where is_activated = true

# set alias
alias octosells as os
alias octosells.users as osu

# query with alias
from osu where name like %bluzky%

# query with relationship
from os.users where role.code = admin
```

## Support operators
`=`, `>`, `>=`, `<`, `<=`, `like`, `ilike`, `in`, `is null`, `is not null`


## How to build
```shell
yarn

# develop
yarn watch

# build
yarn build
```

## Libraries

- [Micromodal](https://github.com/Ghosh/micromodal)
- [Svelte Framework](https://svelte.dev/)
