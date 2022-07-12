data = {
    links: null, linkPosition: 0, permission: true, images: [], domain: '', plus: 0, links_storage: [],
    canProceed: 1, pageLength: 70
};

let mountDomain = new URL(document.URL);
if (document.URL.charAt(0) !== 'h') {
    data.domain = mountDomain.protocol + mountDomain.pathname;
} else {
    data.domain = mountDomain.protocol + "//" + mountDomain.host;
}
allWikis = [];

// canProceed = 1, authorize text search, canProceed = 0 not authorized
// in this case it is free to search for images
// also aborts search on allWikis, when it has one running, and it starts another particular one

if (document.URL.charAt(0) !== 'f') {
    data.domain = document.domain;
}
log = console.log;

function getURL(content, term, start = 0, end = 25) {
    let url;
    url = 'http://localhost:8181/search?content=' + content + '&pattern=' + term + '+&start=' + start + '&end=' + end + '&pageLength=' + data.pageLength;
    return url;
}


function warning(msg) {
    let w = document.querySelector("#warnings");
    w.innerHTML = msg;
    w.style.display = 'block';
}

function callwarning(wiki = false) {
    let hasText = document.querySelector('.result');
    if (hasText.innerText === '') {
        if (wiki) {
            warning('No result was found at ' + wiki + '!');
        } else {
            warning('No result was found!');
        }
    }

}

function clearWarning() {
    let w = document.querySelector("#warnings");
    w.innerHTML = '';
    w.style.display = 'none';
}

implementHTML = (response, wiki, limit = 3, callback = false, one = false) => {
    // let tempHTML = document.querySelector("#temporary-html");
    let tempHTML = document.createElement("div");
    tempHTML.id = 'temporary-html';
    tempHTML.innerHTML = response;
    let allResults = tempHTML.querySelectorAll(".results ul li");
    let results = document.querySelector(".result");
    for (let i = 0; i <= allResults.length - 1; i++) {
        if (i >= limit) {
            break;
        }
        let cnt = allResults[i].outerHTML.replace("<a href", "<a target='_blank' href");
        results.innerHTML += '<div class="block">' + cnt + '<div class="wiki">' + wiki + '</div></div>';
    }
    if (callback) {
        if (one) {
            callback(wiki);
        } else {
            callback();
        }
    }

};

function prepreFetch(termo = false) {
    let topo = document.querySelector("#topo");
    topo.style.display = 'block';
    data.permission = false;
    clearWarning();
    document.querySelector(".result").innerHTML = '';
    let term;
    if (termo === false) {
        term = document.querySelector('input#us').value;
    } else {
        term = termo;
    }
    let sforSpan = document.querySelector("#sfor span");
    if (navigator.language.split("-")[0] === 'pt') {
        sforSpan.innerText = "Buscando por: ";
    } else {
        sforSpan.innerText = "Searching for: ";
    }


    document.querySelector("b.blue").innerHTML = term;
    let inputSearch = document.querySelector("input#us");
    if (inputSearch.value === '') {
        inputSearch.value = term;
    }
    document.title = term + ' - United Search';

    let content = document.querySelector("form select").value;
    if (content === 'all') {
        data.canProceed = 1;
        let cont = 0;
        reCallSearch(allWikis, cont, term);

        function reCallSearch(allWikis, cont, term) {
            let url = getURL(allWikis[cont], term);
            if (cont < allWikis.length) {
                let wiki = allWikis[cont].substring(0, allWikis[cont].search('_'));
                cont++;
                if (wiki === 'pt.stackoverflow.com') {
                    wiki = 'Stack Overflow';
                } else if (wiki === 'economics.stackexchange.com') {
                    wiki = 'Economics';
                }
                let promise = ajax(url);
                promise.then(
                    function (resolve) {
                        if (data.canProceed) {
                            if ((cont + 1) < allWikis.length) {
                                implementHTML(resolve, wiki, 3);
                            } else {
                                implementHTML(resolve, wiki, 3, callwarning, false);
                            }
                            reCallSearch(allWikis, cont, term);
                        }
                    },
                    function () {
                        reCallSearch(allWikis, cont, term);
                        warning('404 error');
                    }
                );
            }
        }

    } else {
        let url = getURL(content, term, 0, 70);
        let wiki = content.substring(0, content.search('_'));
        if (wiki === 'pt.stackoverflow.com') {
            wiki = 'Stack Overflow';
        }
        if (wiki !== 'imagens') {
            data.canProceed = 0; // stop searching on allWikis
            ajax(url).then(resolve => {
                implementHTML(resolve, wiki, 30, callwarning, wiki);

            });
        } else {
            data.canProceed = 0;
            document.title = term + " - Images Search";
            let fromWiki = '';
            allWikis.forEach(wk => {
                if (wk.match(/maxi/) && fromWiki === '') {
                    fromWiki = wk;
                } else if (wk.match(/maxi/) && wk.match(/wikipedia/)) {
                    fromWiki = wk;
                }
            })
            if (fromWiki !== '') {
                let base = document.querySelector('base');
                base.href = "http://localhost:8181/" + fromWiki + "/I/";
            }

            let url = getURL(fromWiki, term, 0, 70);
            data.images = [];
            data.links = [];
            data.permission = true;
            data.linkPosition = 0;
            let wikiContent = fromWiki;
            let qt;
            qt = document.querySelector('#qt');
            if (qt.value === '') {
                qt = 3;
            } else {
                qt = parseInt(qt.value);
            }
            let limitedTo = qt;
            ajax(url).then(
                resolve => {
                    if (data.canProceed === 0) {
                        getLinks(resolve, wikiContent, term, limitedTo);
                    }
                },
                reject => console.log(reject)
            );
        }
    }
    let pname = new URL(document.URL).pathname;
    if (content === 'imagens_') {
        if (document.URL.charAt(0) === 'f') {
            window.history.pushState(new Date(), term, data.domain + '?term=' + term + '&wiki=images');
        } else {
            window.history.pushState(new Date(), term, 'http://' + data.domain + pname + '?term=' + term + '&wiki=images');
        }

    } else {
        if (document.URL.charAt(0) === 'f') {
            window.history.pushState(new Date(), term, data.domain + '?term=' + term);
        } else {
            window.history.pushState(new Date(), term, 'http://' + data.domain + pname + '?term=' + term);
        }
    }
}


window.onload = () => {

    let init = document.querySelector("button");
    init.addEventListener('click', (event) => {
        event.preventDefault();
        prepreFetch(false);
    });

    let url = new URL(document.URL);
    if (url.href.search('term=') !== -1) {
        let term = url.searchParams.get('term');
        prepreFetch(term);
    }

    let select = document.querySelector('select');
    select.onchange = () => {
        select.blur();
        prepreFetch(false);
    };


    // take the id of the clicked image, identify the link bind to it and call window.open
    let re = document.querySelector('.result');
    re.onclick = (event) => {
        if (event.path[0].localName === 'img') {
            let id = event.path[0].id;
            id = id.replace("id", "");
            let link = data.links_storage[id];
            window.open(link, '_blank');
        }
    } // re.onclick

};


function ajax(url, method = 'GET', assync = true) {
    return new Promise(function (resolve, reject) {
        let hr = new XMLHttpRequest();
        if (hr) {
            hr.open(method, url, assync);
            hr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
            hr.send(null);
            hr.onreadystatechange = function () {

                if (hr.status === 200 && hr.readyState === 4) {
                    resolve(hr.response);
                } else {
                    if (hr.status === 404) {
                        reject(new Error('This page return a 404 error'));
                    }
                    if (hr.readyState === 4 && hr.status !== 200) {
                        reject(new Error('This page return a ' + hr.status + ' error'));
                    }
                }
            }
        } else {
            reject(new Error('This browser doesn\'t support XMLHttpRequest'));
        }
    });
}

function getLinks(response, content, term, limit) {
    let res = document.createElement('div');
    res.innerHTML = response;
    let links = res.querySelectorAll('.results ul li a');
    data.links = [...links];
    if (links.length !== 0) {
        // if didn't get here, it means that there is no more results // start=valor&end=valor
        visitLink(content, term, limit);
    }

}

function visitLink(content, term, limit) {
    if (data.links.length > 0) {
        let promise = ajax(data.links[0].href);
        promise.then(
            resolve => {
                if (data.permission) {
                    addPics(resolve, data.links[0].href);
                    data.links.shift();
                    visitLink(content, term, limit)
                }
            },
            () => {
                if (data.permission) {
                    data.links.shift();
                    visitLink(content, term, limit)
                }
            }
        )
    } else if (limit > 0) {
        data.linkPosition++;
        let start = data.linkPosition * 70;
        let end = start + 70;
        let url = getURL(content, term, start, end);
        limit--;
        ajax(url).then(
            resolve => getLinks(resolve, content, term, limit),
            () => {
                if (data.permission) {
                    data.links.shift();
                    visitLink(content, term, limit)
                }
            }
        );
    }
}

function addPics(response, link) {
    if (data.canProceed === 0) {
        let picsLoad = document.createElement('div');
        picsLoad.innerHTML = response;
        let title = picsLoad.querySelector('title').innerText;
        let pictures = picsLoad.querySelectorAll('img');
        let picSelector = document.querySelector('.result');
        pictures.forEach(pic => {
            let imgDots = pic.src.split('.');
            let imgDotsLength = imgDots.length;
            let isSVG = imgDots[imgDotsLength - 1].toLowerCase();

            if (isSVG !== 'svg' && pic.src.toLowerCase().search('bandeira_') === -1 && pic.src.toLowerCase().search('flag_') === -1) {
                let tempPic = document.createElement('img');
                tempPic.src = pic.src;
                tempPic.id = 'id' + data.plus;
                tempPic.title = title;
                tempPic.alt = title;
                data.links_storage.push(link);
                data.plus++;
                if (data.images.indexOf(tempPic.src) === -1) {
                    picSelector.append(tempPic);
                    data.images.push(tempPic.src);
                }
            }

        });
    }
}

function grabWikis() {
    let url = "http://localhost:8181/catalog/search";
    fetch(url, {method: 'GET'}).then(response => {
        response.text().then(data => {
            let divWiki = document.createElement('div');
            let wikiOptions = document.querySelector("select[name='wiki']");
            divWiki.innerHTML = data;
            let wikiTitles = divWiki.querySelectorAll("entry > title");
            let wikiLinks = divWiki.querySelectorAll("entry > link[type='text/html']");
            let wikiPath;
            let index = 0;
            wikiLinks.forEach(wl => {
                wikiPath = wl.getAttribute("href");
                wikiPath = wikiPath.substring(1); // remove slash for the beginning
                let modelOption = document.createElement("option");
                modelOption.value = wikiPath;
                modelOption.id = "id" + index;
                modelOption.innerText = wikiTitles[index].innerText;
                index++;
                wikiOptions.append(modelOption);
                allWikis.push(wikiPath);
            })

            setTimeout(() => {
                automaticSearch();
            }, 500);

        })
    }, reject => {
        alert('Please start Kiwix Server on port 8181');
        window.location = document.URL;
    })


}

grabWikis();

/* Will initiate searching if you have search param(?term=something) on URL */
function automaticSearch() {
    let url = new URL(document.URL);
    if (url.search.match(/\?term=/)) {
        log('automatic search')
        let term = url.search.replace("?term=", "");
        let inputUS = document.getElementById('us');
        inputUS.value = decodeURI(term);
        document.querySelector("button[type='submit']").click();
    }
}

function languageSettings() {
    let lang = navigator.language.split('-')[0];
    if (lang !== 'pt') {
        let search_btn = document.getElementById('search_btn');
        let search_input = document.getElementById('us');
        if (search_btn && search_input) {
            search_btn.innerText = 'Search now';
            search_input.setAttribute('placeholder', 'Type a search term');
        }else{
            setTimeout(()=>{
                log('no');
                languageSettings();
            },1000);
        }
    }
}

languageSettings();