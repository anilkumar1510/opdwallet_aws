import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Router } from "@angular/router";
import * as CryptoJS from 'crypto-js';


@Injectable({
    providedIn: 'root'
})
//We are using localstorage here, not storage service.
export class AppService {
    _currentSessionData : any = {};
    constructor(public http: HttpClient, public Router: Router,){
        this._currentSessionData.encryptKey = this.getCookie('encryptKey');
    }

    

    addXsrfToken(data: any, login_required: boolean) {
        var encrypted = this.getXsrfToken(data, login_required);
       var headers = new HttpHeaders()
                .set('Content-Type', 'application/x-www-form-urlencoded;charset=UTF-8')
                .set('X-XSRF-TOKEN', String(encrypted))
                .set('timezone', String(this.getUserTimezone()))
                .set('current_time', String(this.getCurrentTime()))
                .set('current_url', String(this.Router.url))
                .set('host_name', String(window.location.host));
        return {
            headers,
            responseType: 'text' as const,
            observe: 'response' as const
        };
    }

    getXsrfToken(data : any, login_required : boolean) {
        var key = this._currentSessionData.encryptKey;
        console.log("getXsrfToken Data:::" + data);
        if (key && login_required) {
            console.log("Inside getXsrfToken If Condition:::" + CryptoJS.MD5(data).toString());
            return this.encryptText(key, CryptoJS.MD5(data).toString());
        } else {
            console.log("Inside getXsrfToken Else Condition:::" + CryptoJS.MD5(data).toString());
            return CryptoJS.MD5(data).toString();
        }
    }
    getUserTimezone() {
        try {
            return Intl.DateTimeFormat().resolvedOptions().timeZone;
        } catch (e) {
            return "";
        }
    }
    
    getCurrentTime(): any {
        return new Date().getTime().toString();
    }
    getCurrentSessionData(key: string){
        return this._currentSessionData[key];
    }
    setCurrentSessionData(key: string, value: any){
        this._currentSessionData[key] = value;
    }
    encryptText(key: any, text: any) {
        var ivString = key.substring(0, 16);
        var parsedBase64Key = CryptoJS.enc.Utf8.parse(key);
        var encryptedData = CryptoJS.AES.encrypt(text, parsedBase64Key,
            {
                iv: CryptoJS.enc.Utf8.parse(ivString),
                mode: CryptoJS.mode.CBC,
                padding: CryptoJS.pad.Pkcs7
            }
        );
        return encryptedData.toString();
    }


    getCookie(name: string) {
        const cookies = document.cookie.split(';'); // Split into individual pairs
        for (let cookie of cookies) {
            cookie = cookie.trim(); // Remove leading/trailing spaces
            if (cookie.startsWith(name + '=')) {
            return decodeURIComponent(cookie.substring(name.length + 1));
            }
        }
        return null; // Return null if the cookie doesn't exist
    }
}