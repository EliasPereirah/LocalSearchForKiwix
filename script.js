data = {
    links:null,linkPosition:0, permission:true, images:[], domain:'C:/xampp/htdocs', plus:0,links_storage: [],
    canProceed: 1
};
// canProceed = 1, autorização para buscar texto, canProceed = 0 quando não houver essa autorização
// nesse caso está livre para buscar imagens
// também aborta busca pela allWikis, quando houver uma rodando e for iniciada outra em wiki particular

if(document.URL.charAt(0) !== 'f'){
    data.domain = document.domain;
}
log = console.log;
function getURL(content,term, start=0,end=25){
    let url;
    if(document.URL.charAt(0) === 'f'){
       url =  'http://localhost:8000/search?content='+content+'&pattern='+term+'+&start='+start+'&end='+end;
    }else{
        url = 'http://'+document.domain+'/UnitedSearch/search.php?content='+content+'&pattern='+term+'&start='+start+'&end='+end;
    }
    return url;

}


function warning(msg){
    let w = document.querySelector("#warnings");
    w.innerHTML = msg;
    w.style.display = 'block';
}
function callwarning(wiki = false) {
    let hasText = document.querySelector('.result');
    if(hasText.innerText === ''){
        if(wiki){
            warning('No result was found at '+wiki+'!');
        }else{
            warning('No result was found!');
        }
    }

}

function clearWarning(){
    let w = document.querySelector("#warnings");
    w.innerHTML ='';
    w.style.display = 'none';
}

implementHTML = (response, wiki, limit = 3,callback = false, one = false)=>{
    let tempHTML = document.querySelector("#temporary-html");
    tempHTML.innerHTML = response;
    let allResults = tempHTML.querySelectorAll(".results ul li");
    let results = document.querySelector(".result");
    for(let i =0; i<=allResults.length -1;i++){
        if(i >= limit){
            break;
        }
        results.innerHTML +='<div class="wiki">'+wiki+'</div>'+allResults[i].outerHTML;
    }
    if(callback){
        if(one){
            callback(wiki);
        }else{
            callback();
        }
    }

};

function prepreFetch(termo = false){
    let topo = document.querySelector("#topo");
    topo.style.display = 'block';
    data.permission = false;
    clearWarning();
    document.querySelector(".result").innerHTML = '';
    let term;
    if(termo === false){
         term = document.querySelector('input#us').value;
    }else{
         term = termo;
    }
    let sforSpan = document.querySelector("#sfor span");
    sforSpan.innerText = "Buscando por: ";

    document.querySelector("b.green").innerHTML = term;
    let inputSearch = document.querySelector("input#us");
    if(inputSearch.value ===''){
        inputSearch.value = term;
    }
    document.title = term+' - United Search';

    let content = document.querySelector("form select").value;
    if(content === 'all'){
        data.canProceed = 1;
        let allWikis =
            [
                'wikipedia_pt_all_novid_2018-07',
                'wiktionary_pt_all_novid_2018-07',
                'pt.stackoverflow.com_por_all_2018-08',
                'wikiquote_pt_all_novid_2019-02',
                'wikinews_pt_all_novid_2018-10',
                'wiktionary_en_simple_all_nopic_2019-04',
                'wikibooks_pt_all_novid_2019-04',
                'economics.stackexchange.com_en_all_2019-01',
                'gutenberg_pt_all_2018-10',
                'ted_en_technology_2018-07'
            ];
        let cont = 0;
            reCallSearch(allWikis, cont, term);

            function  reCallSearch(allWikis,cont, term) {
               let url = getURL(allWikis[cont],term);
                if(cont < allWikis.length){
                    let wiki = allWikis[cont].substring(0, allWikis[cont].search('_'));
                    cont++;
                    if(wiki === 'pt.stackoverflow.com'){
                        wiki = 'Stack Overflow';
                    }else if (wiki === 'economics.stackexchange.com'){
                        wiki = 'Economics';
                    }
                    let promise = ajax(url);
                    promise.then(
                        function(resolve){
                            if(data.canProceed){
                                if((cont+1)<allWikis.length){
                                    implementHTML(resolve,wiki,3);
                                }else{
                                    implementHTML(resolve,wiki,3,callwarning, false);
                                }
                                reCallSearch(allWikis, cont, term);
                            }
                        },
                        function(){
                            reCallSearch(allWikis,cont, term);
                            warning('404 error');
                        }
                    );
                }
            }

    }else{
       let url = getURL(content,term,0,70);
        let wiki = content.substring(0, content.search('_'));
        if(wiki === 'pt.stackoverflow.com'){
            wiki = 'Stack Overflow';
        }
        if(wiki !== 'imagens'){
            data.canProceed = 0; // aborta busca em allWikis
            ajax(url).then(resolve=>{
                implementHTML(resolve,wiki,30,callwarning, wiki);

            });
        }else{
            data.canProceed = 0;
            document.title = term+" - Imagens Search";
            let url = getURL('wikipedia_pt_all_novid_2018-07',term, 0, 70);
            //base.href = "http://localhost:8000/wiktionary_pt_all_novid_2018-07//";
            //let url = getURL('wiktionary_pt_all_novid_2018-07',term, 0, 70);
            data.images = [];
            data.links = [];
            data.permission = true;
            data.linkPosition = 0;
            let wikiContent = 'wikipedia_pt_all_novid_2018-07';
             //wikiContent = "wiktionary_pt_all_novid_2018-07";
            let qt;
            qt = document.querySelector('#qt');
            if(qt.value === ''){
                qt = 3;
            }else{
                qt = parseInt(qt.value);
            }
            let limitedTo = qt;
            ajax(url).then(
                resolve =>{if(data.canProceed === 0){
                    getLinks(resolve,wikiContent, term, limitedTo);
                }},
                reject => console.log(reject)
            );
        }
    }
    if(content === 'imagens_') {
        if(document.URL.charAt(0) === 'f'){
            window.history.pushState(new Date(),term,data.domain+'/UnitedSearch/index.html?search='+term+'&wiki=images');
        }else{
            window.history.pushState(new Date(),term,'http://'+data.domain+'/UnitedSearch/index.html?search='+term+'&wiki=images');
        }

    }else{
        if(document.URL.charAt(0) === 'f'){
            window.history.pushState(new Date(),term,data.domain+'/UnitedSearch/index.html?search='+term+'&wiki=all');
        }else{
            window.history.pushState(new Date(),term,'http://'+data.domain+'/UnitedSearch/index.html?search='+term+'&wiki=all');
        }
    }
}

window.onload = ()=>{
    let init = document.querySelector("button");
    init.addEventListener('click',(event)=>{
        event.preventDefault();
        prepreFetch(false);
    });
    let select = document.querySelector('select');
    select.onchange = ()=>{
         select.blur();
        prepreFetch(false);
    };

    let url = new URL(document.URL);
    if(url.href.search('search=') !== -1){
        let term = url.searchParams.get('search');
        prepreFetch(term);
    }

    let greenClick = document.querySelector('b.green');
    greenClick.addEventListener('click', ()=>{
        if(data.domain.charAt(0) ==='C'){
            document.location = data.domain+'/UnitedSearch/index.html';
        }else{
            document.location = 'http://'+data.domain+'/UnitedSearch/index.html';
        }

    });

    // pega o id da imagem clicada, identifica o link pertinente a mesma a chama window.open
    let re = document.querySelector('.result');
    re.onclick = (event)=>{
        if(event.path[0].localName === 'img'){
            let id = event.path[0].id;
            id = id.replace("id","");
            let link = data.links_storage[id];
            window.open(link,'_blank');
        }
    } // re.onclick

};



function ajax(url, method = 'GET', assync = true){
    return new Promise(function(resolve, reject){
        let hr = new XMLHttpRequest();
        if(hr){

            hr.open(method,url, assync);
            hr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
            hr.send(null);
            hr.onreadystatechange = function(){

                if(hr.status === 200 && hr.readyState === 4){
                    resolve(hr.response);
                }else{
                    if(hr.status === 404){
                        reject(new Error('This page return a 404 error'));
                    }
                    if(hr.readyState === 4 && hr.status !== 200){
                        reject(new Error('This page return a '+hr.status+' error'));
                    }
                }
            }
        }else{
            reject(new Error('This browser doesn\'t support XMLHttpRequest'));
        }
    });
}

function getLinks(response,content, term, limit){
    let res = document.createElement('div');
    res.innerHTML = response;
    let links = res.querySelectorAll('.results ul li a');
    data.links = [...links];
    if(links.length !== 0){
        // se não entrar aqui, significa que não há mais resultados // start=valor&end=valor
        visitLink(content, term, limit);
    }

}

function visitLink(content, term, limit) {
    if(data.links.length > 0){
        let promise = ajax(data.links[0].href);
        promise.then(
                resolve =>{if( data.permission){addPics(resolve,data.links[0].href);data.links.shift(); visitLink(content,term, limit)}},
                ()=>{if(data.permission){ data.links.shift(); visitLink(content, term, limit)}}
            )
    }else if(limit >0){
        data.linkPosition++;
        let start = data.linkPosition * 70;
        let end = start+70;
        let url = getURL(content,term,start,end);
        limit--;
            ajax(url).then(
                resolve => getLinks(resolve,content, term, limit),
                ()=>{if(data.permission){ data.links.shift(); visitLink(content, term, limit)}}
            );
    }
}

function addPics(response,link) {
    if(data.canProceed === 0){
        let picsLoad = document.createElement('div');
        picsLoad.innerHTML = response;
        let title = picsLoad.querySelector('title').innerText;
        let pictures = picsLoad.querySelectorAll('img');
        let picSelector = document.querySelector('.result');
        pictures.forEach(pic =>{
            let imgDots = pic.src.split('.');
            let imgDotsLength = imgDots.length;
            let isSVG = imgDots[imgDotsLength - 1].toLowerCase();

            if(isSVG !== 'svg' && pic.src.toLowerCase().search('bandeira_') === -1 && pic.src.toLowerCase().search('flag_') === -1){
                let tempPic = document.createElement('img');
                tempPic.src = pic.src;
                tempPic.id = 'id'+data.plus;
                tempPic.title = title;
                tempPic.alt = title;
                data.links_storage.push(link);
                data.plus++;
                if(data.images.indexOf(tempPic.src) === -1){
                    picSelector.append(tempPic);
                    data.images.push(tempPic.src);
                }
            }

        });
    }
}



















