## How to build extension?

```bash
# Run this line if it's the first time you try to build
npm i

npm run build
```


## How to build JS SDK?

```bash
# Run this line if it's the first time you try to build extension or sdk
npm i

npm run build-sdk
```


## How to use JS SDK?

1. Include HTML snippet in your page
    ```html
      <script>
      javascript:function iprl5(){var d=document,z=d.createElement('scr'+'ipt'),b=d.body,l=d.location;try{if(!b)throw(0);z.setAttribute('src',l.protocol+'//bridgit.io/app/sdk/sdk.js'+'?t='+(new Date().getTime()));b.appendChild(z);}catch(e){alert('Please wait until the page has loaded.');}}iprl5();void(0)
      </script>
    ```

2. Create an browser bookmark with that javascript (without '<script>' '</script>'), so that you can test on any pages. [tutorial](https://www.useloom.com/share/3416fcecd5e7487c92903644422e5ed2?focus_title=1&muted=1)


