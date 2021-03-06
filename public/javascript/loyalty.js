class Loyalty {

    mobileview;

    constructor() {

        console.log('INITIALIZING LOYALTY APP');      

        var phoneview = document.getElementById("phoneview");
        this.mobileview = phoneview.getMobileView();

    }

    signup() {
        console.log('loyalty.signup');

        // var phoneview = document.getElementById("phoneview");
        // var mobileview = phoneview.getMobileView();
        this.mobileview.innerHTML = "";

        var element = document.createElement('login-element');
        getRandomUser((firstname, surname, password, email) => {
            element.setAttribute('firstname', firstname);
            element.setAttribute('surname', surname);
            element.setAttribute('password', password);
            element.setAttribute('email', email);
            element.setAttribute('username', firstname + surname);

            this.mobileview.appendChild(element);
        })

        /* same as mobileview.innerHTML =
        '<login-element firstname="John surname="Lennon" password="######" username="john@email.com"></login-element>' */
    }

    parseJwt (token) {
        var base64Url = token.split('.')[1];
        var base64 = base64Url.replace('/-/g', '+').replace('/_/g', '/');
        var jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));

        return JSON.parse(jsonPayload);
    };

    getCookie(cname) {
        var name = cname + "=";
        var decodedCookie = decodeURIComponent(document.cookie);
        var ca = decodedCookie.split(';');
        for(var i = 0; i <ca.length; i++) {
          var c = ca[i];
          while (c.charAt(0) == ' ') {
            c = c.substring(1);
          }
          if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
          }
        }
        return "";
      }
}

var loyalty = new Loyalty();
