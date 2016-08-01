'use strict';

import request from 'request';
import Socket from 'ws';
import Quip from 'Quip.js';

const SLACK_API = 'https://slack.com/api/';
const ACTIONS = {
  'auth'  :  {get: 'rtm.start'},
  'history': {get: 'channels.history'}
};

class QuipAPI {
  constructor(params) {

    if(!params.token) {
      console.log("Quip token is empty.");
      return false;
    }

    this.token = params.token;

    this.quip = new Quip({
      accessToken: this.token
    });

    this.setThreads();
  }

  setThreads() {

    var self = this;

    this.quip.th.getRecentThreads(function(error, data) {
      let threads = [];

      for (let [k, v] of Object.entries(data)) {
        threads.push({[v.thread.title]: k});
      }

      self.threads = threads;

    });

  }

  postToQuip(thread_name, message) {
    const self = this;

    console.log("post to quip");
    console.log(thread_name);
    console.log("post to quip");

    this.findChannelByName(thread_name).then((id) => {
      self.addToThread(id, message);
    });

  }

  addToThread(thread_id, content) {
    self.quip.msg.newMessage({thread_id, content});
  }

  findChannelByName(name) {
    var self = this;

    return new Promise((resolve, reject) => {

      self.threads.forEach((el) => {
        console.log(el, name);
        for (let [k, v] of Object.entries(el)) {
          if(k.toLowerCase() === name.toLowerCase()) {
            resolve(v);
          }
        }

      });

    });

  }

}

class SlackQuip {

  constructor(params) {

    if(typeof params !== 'object') {
      params = {};
    }

    if(!params.slack.token) {
      console.log("Token is empty.");
      return false;
    }

    if(params.slack.tag.indexOf("#") !== -1) {
      console.log("Can't use # as a tag. Please, use something else.");
      return false;
    }

    this.token = params.slack.token;
    this.tag = params.slack.tag || '!quip';

    this.quip = new QuipAPI(params.quip);

    this.initializeData();
  }

  async initializeData() {

    const authorize = await this.api(ACTIONS.auth.get);

    const channels = authorize.channels.map((el) => {
        return { [el.id]: el.name };
    });

    this.connection = {
          url: authorize.url,
          users: authorize.users,
          channels
    };

    this.socket = new Socket(authorize.url);
    this.initializeEvents();
  }

  getChannelNameById(id) {

      return new Promise((resolve, reject) => {

        this.connection.channels.forEach((el) => {
          for (let [slack_id, name] of Object.entries(el)) {
            if(id === slack_id) {
              resolve(name);
            }
          }

        });

        reject("Unable to match Slack -> Quip threads");

      });

  }

  initializeEvents() {

    const self = this;

    this.socket.on('message', (data) => {

      const response = JSON.parse(data);

      if(response.type === 'message') {

        if(response.text.indexOf(this.tag) !== -1) {

          const channel = response.channel;

          this.getChannelNameById(channel).then((room_name) => {
            const msg = response.text.replace(self.tag, "").trim();
            self.quip.postToQuip(room_name, msg);
          }).catch((err) => {
            console.log(err);
          });

        } else {
          console.log(response);
        }

      }

    });

  }

  api(action) {

    const URL = `${SLACK_API}${action}?token=${this.token}`;

    return new Promise((resolve, reject) => {

      request.get(URL, function (error, response, body) {
        if(error) {
          reject(error);
        }

        resolve(JSON.parse(body));
      });

    });

  }

}

let a = new SlackQuip({
  slack: {
    token: '',
    tag: '!quip'
  },
  quip: {
    token: ''
  }
});
