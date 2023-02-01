This will at some point have more details on how to start this project

for now:

### Installing
`cd js`
`npm install`

### Running
*(if needed, open ports by running the* `wslbridge.ps1` *script in powershell)*
`npm run build && cp -R dist/ ~/projects/bahn/backend/ && echo "Ran at $(date +"%T")"`

then open `http://[ip address of the backend]/` in a browser