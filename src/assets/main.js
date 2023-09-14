const CLIENT_ID = '35910052181-t1950mf5aeqef4aennlsh4v2gj4ap11q.apps.googleusercontent.com';
const API_KEY = 'AIzaSyDI9wpVTRdpB1d4A_wPETCcpV-ZT-3de1o';

// Discovery doc URL for APIs used by the quickstart
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';

// Authorization scopes required by the API; multiple scopes can be
// included, separated by spaces.
const SCOPES = 'https://www.googleapis.com/auth/drive';

var access_token = '';

let tokenClient;
let gapiInited = false;
let gisInited = false;

window.addEventListener('DOMContentLoaded', (event) => {
    access_token = localStorage['access_token']

    handleAuthClick()
    

    document.getElementById('search').addEventListener('keyup', function(e){
        if(e.key == 'Enter' || e.keyCode === 13){
            search()
        }
    })
})

/**
 * Callback after api.js is loaded.
 */
function gapiLoaded() {
    gapi.load('client', initializeGapiClient);
}

/**
 * Callback after the API client is loaded. Loads the
 * discovery doc to initialize the API.
 */
async function initializeGapiClient() {
    await gapi.client.init({
        apiKey: API_KEY,
        discoveryDocs: [DISCOVERY_DOC],
    });
    gapiInited = true;
}

/**
 * Callback after Google Identity Services are loaded.
 */
function gisLoaded() {
    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: '', // defined later
    });
    gisInited = true;

    //maybeEnableButtons();
}

/**
 *  Sign in the user upon button click.
 */
function authorization() {
    tokenClient.callback = async (resp) => {
        if (resp.error !== undefined) {
            throw (resp);
        }
        //document.getElementById('signout_button').style.visibility = 'visible';
        //document.getElementById('authorize_button').innerText = 'Refresh';
        await listFiles();
    };

    if (gapi.client.getToken() === null) {
        // Prompt the user to select a Google Account and ask for consent to share their data
        // when establishing a new session.
        tokenClient.requestAccessToken({ prompt: 'consent' });
    } else {
        // Skip display of account chooser and consent dialog for an existing session.
        tokenClient.requestAccessToken({ prompt: '' });
    }
}
function handleAuthClick() {
    tokenClient.callback = async (resp) => {
        if (resp.error !== undefined) {
            throw (resp);
        }
        //document.getElementById('signout_button').style.visibility = 'visible';
        //document.getElementById('authorize_button').innerText = 'Refresh';
        await listFiles();
        await isAuth()
    };

    if (tokenClient === null) {
        // Prompt the user to select a Google Account and ask for consent to share their data
        // when establishing a new session.
        tokenClient.requestAccessToken({ prompt: 'consent' });
    } else {
        // Skip display of account chooser and consent dialog for an existing session.
        tokenClient.requestAccessToken({ prompt: '' });
    }
    localStorage['access_token'] = tokenClient
}

/**
 *  Sign out the user upon button click.
 */
function handleSignoutClick() {
    const token = gapi.client.getToken();
    if (token !== null) {
        google.accounts.oauth2.revoke(token.access_token);
        gapi.client.setToken('');
        //document.getElementById('content').innerText = '';
        //document.getElementById('authorize_button').innerText = 'Authorize';
        //document.getElementById('signout_button').style.visibility = 'hidden';
    }
}

function share(id) {
    console.log("Sharing")
    init = function () {
        s = new gapi.drive.share.ShareClient();
        s.setOAuthToken(gapi.client.getToken().access_token);
        s.setItemIds([id]);
    }
    gapi.load('drive-share', init);

    showSettingsDialog()
}

async function search(){
    try{
        console.log("Searching!")
    }catch(err){
        throw err;
    }
}

function getUserInfo(){
    try{
        fetch('https://www.googleapis.com/drive/v3/about?fields=kind,user,storageQuota',{
            method: 'GET',
            mode: 'cors',
            credentials: 'same-origin',
            payload: {
                fields: 'kind,user,storageQuota' 
             },
            headers: new Headers({ 'Authorization': 'Bearer ' + gapi.client.getToken().access_token})
        }).then(res => res.json()).then(res => {
            document.getElementById('username').innerText = res.user.displayName;
            document.getElementById('email').innerText = res.user.emailAddress;
            document.getElementById('picture').src = res.user.photoLink;
        })
    }catch(error){
        throw error;
    }
}

function isAuth(){
    document.getElementById('alert').style = "display: none"
    getUserInfo()
}

async function rename(id){
    var newName = prompt("New name")

    var file = {name: newName}

    try{
        await fetch('https://www.googleapis.com/drive/v3/files/'+id, {
            method: 'PATCH',
            mode: 'cors',
            credentials: 'same-origin',
            headers: new Headers({ 'Authorization': 'Bearer ' + gapi.client.getToken().access_token, 'Content-Type': 'application/json' }),
            body: JSON.stringify(file),
        }).then(res => console.log(res))

        await listFiles()

    }catch(error){
        throw error
    }
}

function download_file(id) {
    try {
        fetch('https://www.googleapis.com/drive/v3/files/' + id + '?alt=media', {
            method: 'GET',
            mode: 'cors',
            credentials: 'same-origin',
            headers: new Headers({ 'Authorization': 'Bearer ' + gapi.client.getToken().access_token })
        }).then(res => res.blob()).then(blob => {


            var a = document.createElement('a');
            a.download = "download";
            a.href = window.URL.createObjectURL(blob);
            a.click();

            console.log(blob);
        });
    } catch (error) {
        throw error
    }
}

async function remove(id) {
    let bar = confirm('Confirm or deny');
    if(!bar){
        return;
    }
    try {
        await fetch('https://www.googleapis.com/drive/v3/files/' + id, {
            method: 'DELETE',
            mode: 'cors',
            credentials: 'same-origin',
            headers: new Headers({ 'Authorization': 'Bearer ' + gapi.client.getToken().access_token })
        }).then(res => console.log(res));

        await listFiles()
    } catch (error) {
        throw error;
    }
}

/**
 * Print metadata for first 10 files.
 */
async function listFiles() {
    let response;
    try {
        response = await gapi.client.drive.files.list({
            'pageSize': 10,
            'fields': 'files(id, name, modifiedTime, size)',
        });
    } catch (err) {
        //document.getElementById('content').innerText = err.message;
        return;
    }
    const files = response.result.files;
    if (!files || files.length == 0) {
        document.getElementById('table').innerText = 'No files found.';
        return;
    }
    const table = document.getElementById('table')
    table.innerHTML = `<tr>
    <th>id</th>
    <th>Name</th>
    <th>Modification</th>
    <th>Size</th>
    <th>Actions</th>
    </tr>`
    var i = 0;
    for (var element of files) {
        var row = table.insertRow()
        var id = row.insertCell(0)
        var name = row.insertCell(1)
        var modified = row.insertCell(2)
        var size = row.insertCell(3)
        var actions = row.insertCell(4)

        id.innerHTML = `#${i}`
        name.innerHTML = element.name
        modified.innerHTML = element.modifiedTime
        size.innerHTML = element.size
        actions.innerHTML = "<a id='trash' href='#' onclick='remove(\"" + element.id + "\")' class='fa fa-trash'></a><a id='pencil' href='#' onclick='rename(\"" + element.id + "\")' class='fa fa-pencil'></a><a id='download' href='javascript:void(0)' onclick='download_file(\"" + element.id + "\")' class='fa fa-download'></a><a id='share' href='#' onclick='share(\"" + element.id + "\")' class='fa fa-share'></a>"
        i++;


    }
}

function saveFile(blob) {
    const reader = new FileReader();

    // Define a load event handler
    reader.onload = function (e) {
        // Get the data URL of the file
        const dataURL = e.target.result;

        // Save the data URL to localStorage with a key "image"
        localStorage.setItem("image", dataURL);

        // Create an anchor element with the download attribute
        const link = document.createElement("a");
        link.download = "image.jpg"; // The name of the downloaded file
        link.href = blob; // The blob URL of the file
        link.textContent = "Download image"; // The text of the link

        // Append the link to the document body
        document.body.appendChild(link);
    };

    // Read the file as a data URL
    reader.readAsDataURL(file);
}

async function upload() {
    // Get the file from the input tag
    const files = document.getElementById("files").files;
    const file = files[0];

    // Read the file as an array buffer
    const fr = new FileReader();
    fr.readAsArrayBuffer(file);
    fr.onload = async (f) => {
        // Create the file metadata
        const fileMetadata = {
            name: file.name,
            parents: this.currentDirectoryId ? [this.currentDirectoryId] : [] // This is from your script.
        }

        // Create a form data object
        const form = new FormData();
        form.append('metadata', new Blob([JSON.stringify(fileMetadata)], { type: 'application/json' }));
        form.append('file', new Blob([new Uint8Array(f.target.result)], { type: file.type }));

        // Send a fetch request with the access token
        await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id', {
            method: 'POST',
            mode: 'cors',
            credentials: 'same-origin',
            headers: new Headers({ 'Authorization': 'Bearer ' + gapi.client.getToken().access_token }),
            body: form
        }).then(res => res.json()).then(res => console.log(res));
        await listFiles()
    };
}