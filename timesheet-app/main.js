const { app, BrowserWindow } = require('electron');

const storage = require('electron-json-storage');

// Time in hours. When user click "End", check the time diff. 
// If the time diff > max_hours, set the end_time to start_time + default_hours
const max_hours = 5; 
const default_hours = 1;

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win;

var uname;

var Type = {"admin":0, "user":1};

const login_win_width = 450;
const login_win_height = 600;
const user_win_width = 500;
const user_win_height = 700;
const admin_win_width = 600;
const admin_win_height = 800;

function createWindow () {
    // Create the browser window.
    win = new BrowserWindow({ width: login_win_width, height: login_win_height })

    // and load the index.html of the app.
    win.loadFile('index.html')

    // Open the DevTools.
    //win.webContents.openDevTools()

    // Emitted when the window is closed.
    win.on('closed', () => {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        win = null
    })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', () => {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (win === null) {
        createWindow();
    }
})

function check()
{
    // Check if admin exists
    storage.get('admin', function(error, data) {
        if (error) throw error;

        console.log(data);
        var list = Object.values(data);
        if (list.length == 0) {
            hide('login-container');
            show('createadmin-container');
        }
    });
}

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

function handleLoginSubmit(username, password)
{
    alert("username:" + username + "; password: " + password);
}

function login(username, password)
{
    //const defaultDataPath = storage.getDefaultDataPath()
    //console.log("path: " + defaultDataPath);

    storage.has(username, function(error, hasKey) {
        if (error) throw error;

        if (hasKey) {
            console.log('There is user data stored');

            storage.get(username, function(error, data) {
                if (error) throw error;

                console.log(data);
                
                if (data.password == password) {
                    console.log('Password is correct');
                    uname = username;
                    console.log('username: ' + uname);
                    hide('login-container');
                    show('logout-container');
                    if (data.type === Type.admin) {
                        show('admin-container');
                        show('adminaction-container');
                        win = require('electron').remote.getCurrentWindow();
                        win.setSize(admin_win_width, admin_win_height);
                    } else if (data.type === Type.user) {
                        show('userinfo-container');
                        win = require('electron').remote.getCurrentWindow();
                        win.setSize(user_win_width, user_win_height);
                        displayLastLog(uname);
                    }
                } else {
                    console.log('Password is incorrect');
                    alert('Password is incorrect');
                }
            });
        } else {
            console.log('Cannot find username ' + username);
            alert('User does not exist');
        }
    });
}

function logout()
{
    if (uname) {
        uname = null;
    }
    init();
}

function init()
{
    win = require('electron').remote.getCurrentWindow();
    win.setSize(login_win_width, login_win_height);

    show('login-container');
    document.getElementsByName('uname')[0].value = "";
    document.getElementsByName('psw')[0].value = "";

    hide('logout-container');

    hide('userinfo-container');
    document.getElementById('start-time').innerHTML = "";
    document.getElementById('end-time').innerHTML = "";

    hide('admin-container');
    hide('adminaction-container');
    hide('createuser-container');

    hide('userlist-container');
    clearUserList();

    hide('userlog-container');
    clearUserLog();

    hide('createadmin-container');
}

function clearUserList()
{
    clearTable("userlist");
}

function clearUserLog()
{
    clearTable("userlog");
}

function clearTable(table_id)
{
    var table = document.getElementById(table_id);
    if (table) {
        console.log("find table rows: " + table.rows.length);
        for (var i=table.rows.length-1; i>0; i--) {
            table.deleteRow(i);
        }
    }
}

function createUser(type, username, password)
{
    storage.has(username, function(error, hasKey) {
        if (error) throw error;

        if (hasKey) {
            console.log('There is user data stored');
            alert('User exists!');
        } else {
            storage.set(username, { 
                username: username, 
                password: password,
                type: type
            }, function(error) {
                if (error) throw error;
                console.log('User is created');
                alert('User is created');
                closeCreateUser();
            });
        }
    });
}

function createAdmin(username, password) {
    storage.has(username, function(error, hasKey) {
        if (error) throw error;

        if (hasKey) {
            console.log('There is user data stored');
            alert('User exists!');
        } else {
            storage.set(username, { 
                username: username, 
                password: password,
                type: Type.admin
            }, function(error) {
                if (error) throw error;
                hide('createadmin-container');
                login(username, password);
            });
        }
    });
}

function getTime()
{
    return Date.now();
}

function logStartTime(username, time)
{
    storage.has(username, function(error, hasKey) {
        if (error) throw error;
        

        storage.get(username, function(error, data) {
            if (error) throw error;    
        
            var timelog_array = data.timelog; // This is an array!
            if (!timelog_array) {
                timelog_array = [];
            }
            if (timelog_array) {
                var log_entry = { start_time: time };
                timelog_array.unshift(log_entry); // Add one entry in front 
                console.log (timelog_array);
                storage.set(username, { 
                    username: data.username, 
                    password: data.password,
                    type: data.type,
                    timelog: timelog_array }, function(error) {
                        if (error) throw error;
                        displayLastLog(username);
                    });
            }
        });
    });
}

function logEndTime(username, time) {
    storage.has(username, function(error, hasKey) {
        if (error) throw error;

        storage.get(username, function(error, data) {
            if (error) throw error;    
        
            var timelog_array = data.timelog; // This is an array!
            if (!timelog_array) {
                timelog_array = [];
            }
            if (timelog_array.length > 0) {
                var log_entry = timelog_array[0];
                var start = log_entry.start_time;
                if (timeDiffIsTooLarge(start, time, max_hours)) {
                    time = addToTime(start, default_hours);
                }
                log_entry = { start_time: log_entry.start_time, end_time: time };
                timelog_array[0] = log_entry; // Modify the first entry
                console.log (timelog_array);
                storage.set(username, { 
                    username: data.username, 
                    password: data.password,
                    type: data.type,
                    timelog: timelog_array }, function(error) {
                        if (error) throw error;
                        displayLastLog(username);
                    });
            }
        });
    });
}

function logStartTimeHandle()
{
    if (uname) {
        console.log("calling logStartTime. username: " + uname);
        logStartTime(uname, getTime());
    }
}

function logEndTimeHandle()
{
    if (uname) {
        console.log("calling logStartTime. username: " + uname);
        logEndTime(uname, getTime());
    }
}

function hide(name) {
    console.log('hide ' + name);
    var x = document.getElementById(name);
    x.style.display = "none";
}

function show(name) {
    console.log('show ' + name);
    var x = document.getElementById(name);
    x.style.display = "block";
}

function timeDiffIsTooLarge(start, end, max_hours) {
    var difference = end - start; // time in milliseconds
    var diff_hours = difference/3600/1000;
    return diff_hours > max_hours;
}

function addToTime(time, hours) {
    return time += 3600*1000*hours;
}

function timeDiffInHours(start, end) {
    var difference = end - start; // time in milliseconds
    return round(difference/3600/1000);
}

function round(num) {
   return Math.round(num * 10) / 10;
}

function formatTime(milliseconds) {
    var dayTime = new Date(milliseconds);
    var date = dayTime.getFullYear()+'-'+(dayTime.getMonth()+1)+'-'+dayTime.getDate();
    var time = dayTime.getHours() + ":" + dayTime.getMinutes() + ":" + dayTime.getSeconds();
    var date_time_str = date+' '+time;
    return date_time_str;
}

function displayLastLog(username) {
    storage.has(username, function(error, hasKey) {
        if (error) throw error;
        
        storage.get(username, function(error, data) {
            if (error) throw error;    
        
            var timelog_array = data.timelog; // This is an array!
            if (!timelog_array) {
                timelog_array = [];
            }
            if (timelog_array.length > 0) {
                var log_entry = timelog_array[0];
                // Display start time
                if (log_entry.hasOwnProperty('start_time')) {
                    document.getElementById("start-time").innerHTML = formatTime(log_entry.start_time);
                } else {
                    document.getElementById("start-time").innerHTML = "";
                }
                // Display end time
                if (log_entry.hasOwnProperty('end_time')) {
                    document.getElementById("end-time").innerHTML = formatTime(log_entry.end_time);
                }
                else {
                    document.getElementById("end-time").innerHTML = "";
                }
            }
        });
    });
}

function displayUserLog(username) {
    hide('userlist-container');
    show('userlog-container');

    document.getElementById("userlog-username").innerHTML = username;

    storage.has(username, function(error, hasKey) {
        if (error) throw error;
        
        storage.get(username, function(error, data) {
            if (error) throw error;    
        
            var timelog_array = data.timelog; // This is an array!
            if (!timelog_array) {
                timelog_array = [];
            }
            if (timelog_array.length > 0) {
                for (var i=0; i<timelog_array.length; i++) {
                    var table = document.getElementById("userlog");
                    for (var i=0; i<timelog_array.length; i++) {
                        var entry = timelog_array[i];
                        var row = table.insertRow(i+1);
                        var cell1 = row.insertCell(0);
                        var cell2 = row.insertCell(1);
                        var cell3 = row.insertCell(2);

                        if (entry.hasOwnProperty('start_time')) {
                            cell1.innerHTML = formatTime(entry.start_time);
                        } else {
                            cell1.innerHTML = "";
                        }

                        if (entry.hasOwnProperty('end_time')) {
                            cell2.innerHTML = formatTime(entry.end_time);
                        } else {
                            cell2.innerHTML = "";
                        }

                        if (entry.hasOwnProperty('start_time') && entry.hasOwnProperty('end_time')) {
                            cell3.innerHTML = timeDiffInHours(entry.start_time, entry.end_time);
                        }
                    }
                }
            }
        });
    });
}

function closeUserLog()
{
    clearUserLog();
    hide('userlog-container');
    show('userlist-container');
}

function closeUserList()
{
    clearUserList();
    hide('userlist-container');
    show('admin-container');
    show('adminaction-container');
}

function closeCreateUser()
{
    hide('createuser-container');
    show('adminaction-container');
}

function displayUserList() {
    hide('adminaction-container');
    show('userlist-container');

    storage.getAll(function(error, data) {
        if (error) throw error;
        var list = Object.values(data);
        var table = document.getElementById("userlist");
        for (var i=0; i<list.length; i++) {
            var entry = list[i];
            if (entry.type === Type.admin) { continue; }
            var row = table.insertRow(-1);
            var cell1 = row.insertCell(0);
            var cell2 = row.insertCell(1);
            var cell3 = row.insertCell(2);
            cell1.innerHTML = entry.username;
            cell2.innerHTML = entry.password;
            cell3.innerHTML = '<button type="start-button" onclick="displayUserLog(&quot;'+entry.username+'&quot;)">View Log</button>';
        }
    });
}

function displayCreateUser()
{
    show('createuser-container');
    hide('adminaction-container');
}