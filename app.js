var xhttp = new XMLHttpRequest();

xhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
        getPostData(this);
    }
};
xhttp.open("GET", "https://blog.buddhilive.com/atom.xml?redirect=false&start-index=1&max-results=500", true);
xhttp.send();

function getPostData(xml) {
    var xmlDoc = xml.responseXML;
    var entries = [];

    for (var i = 0; i < 4; i++) {
        entries.push(xmlDoc.getElementsByTagName('entry')[i]);
    }

    entries.map(element => {
        var tempElement = document.createElement('div');
        tempElement.innerHTML = element.outerHTML;
        var postContent = tempElement.querySelector('content').textContent.replace(/<\/?[^>]+(>|$)/g, "");
        var postSummary = postContent.substring(0, 50) + "...";
        var postTitle = tempElement.querySelector('title').innerHTML;
        var postLink = tempElement.querySelector('[rel="alternate"]').href;
        //var postThumbElement = tempElement.getElementsByTagName('media:thumbnail')[0];
        var postThumbElement = document.createElement('div');
        postThumbElement.innerHTML = tempElement.querySelector('content').textContent;

        var postThumb = "https://www.buddhilive.com/images/wear.png";
        if (postThumbElement) {
            //postThumb = postThumbElement.getAttribute('url');
            postThumb = postThumbElement.querySelector('img').getAttribute('src');
            //console.log(postThumbElement);
        }

        var cardTemplate = `<div class="mdl-cell mdl-cell--3-col mdl-cell--4-col-tablet mdl-cell--4-col-phone mdl-card mdl-shadow--3dp">
        <div class="mdl-card__media">
            <img class="thumbImage" src="` + postThumb + `">
        </div>
        <div class="mdl-card__title">
            <h4 class="mdl-card__title-text">` + postTitle + `</h4>
        </div>
        <div class="mdl-card__supporting-text">
            <span class="post--content mdl-typography--font-light mdl-typography--subhead">` + postSummary + `</span>
        </div>
        <div class="mdl-card__actions">
            <a class="android-link mdl-button mdl-js-button mdl-typography--text-uppercase" href="` + postLink + `">
        Read More
        <i class="material-icons">chevron_right</i>
        </a>
        </div>
        </div>`;

        document.querySelector('.android-card-container').innerHTML += cardTemplate;

        /* console.log(postSummary, postTitle, postLink, postThumb);
        console.log(element); */
    });
}