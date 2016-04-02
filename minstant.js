Chats = new Mongo.Collection("chats");


if (Meteor.isClient) {

    Meteor.subscribe("chats");
    Meteor.subscribe("users");

    var getMessages = function(){
      var chat = Chats.findOne({_id:Session.get("chatId")});
      if(chat)
        return chat.messages;

      return [];
    };

    var updateScroll = Tracker.autorun(function () {
        var messages = getMessages();
        setTimeout(function(){
            var messages_container = document.getElementsByClassName("messages-container");
            if(messages_container[0])
                messages_container[0].scrollTop = messages_container[0].scrollHeight + 100;
        }, 200);
    });

    var loggedout = Tracker.autorun(function(computation){
        var currentUser = Meteor.user()
        if(currentUser) {

        } else if(!computation.firstRun) {
            Route.go('/');
        }
    });


  // set up the main template the the router will use to build pages
  Router.configure({
    layoutTemplate: 'ApplicationLayout'
  });
  // specify the top level route, the page users see when they arrive at the site
  Router.route('/', function () {
    console.log("rendering root /");
    this.render("navbar", {to:"header"});
    this.render("lobby_page", {to:"main"});
  });

  // specify a route that allows the current user to chat to another users
  Router.route('/chat/:_id', function () {

      if(Meteor.userId())
      {

      } else {
          Router.go('/');
          return;
      }
    // the user they want to chat to has id equal to
    // the id sent in after /chat/...
    var otherUserId = this.params._id;
    // find a chat that has two users that match current user id
    // and the requested user id
    var filter = {$or:[
                {user1Id:Meteor.userId(), user2Id:otherUserId},
                {user2Id:Meteor.userId(), user1Id:otherUserId}
                ]};
    var chat = Chats.findOne(filter);
    if (!chat){// no chat matching the filter - need to insert a new one
      chatId = Meteor.call("newChat", otherUserId);
    }
    else {// there is a chat going already - use that.
      chatId = chat._id;
    }
    if (chatId){// looking good, save the id to the session
      Session.set("chatId",chatId);
    }
    Session.set("otherUserId", otherUserId);
    this.render("navbar", {to:"header"});
    this.render("chat_page", {to:"main"});
  });

  ///
  // helper functions
  ///
  Template.available_user_list.helpers({
    users:function(){
      return Meteor.users.find();
    }
  })
 Template.available_user.helpers({
    getUsername:function(userId){
      user = Meteor.users.findOne({_id:userId});
      return user.profile.username;
    },
    isMyUser:function(userId){
      if (userId == Meteor.userId()){
        return true;
      }
      else {
        return false;
      }
    }
  })


  Template.chat_page.helpers({
    messages:function(){
      var chat = Chats.findOne({_id:Session.get("chatId")});
      return chat.messages;
    },
    smiles: function() {
        return [{ img:'smile-1'},{img:'smile-2'},{img:'smile-3'},{img: 'smile-4'},{img: 'smile-5'},{img: 'smile-6'}, {img:'smile-7'}];
    },
    other_user:function(){
        user = Meteor.users.findOne({_id:Session.get("otherUserId")});
        return user.profile.username;
    }
  })
 Template.chat_page.events({
  // this event fires when the user sends a message on the chat page
  'submit .js-send-chat':function(event){
    // stop the form from triggering a page reload
    event.preventDefault();
    // see if we can find a chat object in the database
    // to which we'll add the message
    var chat = Chats.findOne({_id:Session.get("chatId")});
    if (chat){// ok - we have a chat to use
      var msgs = chat.messages; // pull the messages property
      if (!msgs){// no messages yet, create a new array
        msgs = [];
      }
      // is a good idea to insert data straight from the form
      // (i.e. the user) into the database?? certainly not.
      // push adds the message to the end of the array
      msgs.push({user: Meteor.userId(), text: event.target.chat.value});
      // reset the form
      event.target.chat.value = "";
      // put the messages array onto the chat object
      chat.messages = msgs;
      // update the chat object in the database.
      //Chats.update(chat._id, chat);
      Meteor.call("updateChat", chat);
      setTimeout(function(){
          var messages_container = document.getElementsByClassName("messages-container");
          messages_container[0].scrollTop = messages_container[0].scrollHeight + 100;
      }, 200);
          }
  },
  'click .emoji':function(event){
    // stop the form from triggering a page reload
    event.preventDefault();
    // see if we can find a chat object in the database
    // to which we'll add the message
    var chat = Chats.findOne({_id:Session.get("chatId")});
    if (chat){// ok - we have a chat to use
      var msgs = chat.messages; // pull the messages property
      if (!msgs){// no messages yet, create a new array
        msgs = [];
      }
      // is a good idea to insert data straight from the form
      // (i.e. the user) into the database?? certainly not.
      // push adds the message to the end of the array
      msgs.push({user: Meteor.userId(), text: "#" + event.target.alt});
      // reset the form
      //event.target.chat.value = "";
      // put the messages array onto the chat object
      chat.messages = msgs;
      // update the chat object in the database.
      //Chats.update(chat._id, chat);
      Meteor.call("updateChat", chat);
      setTimeout(function(){
          var messages_container = document.getElementsByClassName("messages-container");
          messages_container[0].scrollTop = messages_container[0].scrollHeight + 100;
      }, 200);
    }
  }

 })

 Template.chat_message.helpers({
     getUsername: function(userId) {
         user = Meteor.users.findOne({_id:userId});
         return user.profile.username;
     },
     getUserAvatar: function(userId) {
         user = Meteor.users.findOne({_id:userId});
         return user.profile.avatar;
     },
     isMyMessage:function(userId){
       if (userId == Meteor.userId()){
         return true;
       }
       else {
         return false;
       }
     },
     isEmojiMessage:function(text){
       if(text.indexOf("#smile") == 0)
        return true;
       else {
           return false
       }
     },
       getEmoji: function(text){
           return text.substring(1, text.length);
       }
 })
}


// start up script that creates some users for testing
// users have the username 'user1@test.com' .. 'user8@test.com'
// and the password test123

if (Meteor.isServer) {
  Meteor.startup(function () {
    if (!Meteor.users.findOne()){
      for (var i=1;i<9;i++){
        var email = "user"+i+"@test.com";
        var username = "user"+i;
        var avatar = "ava"+i+".png"
        console.log("creating a user with password 'test123' and username/ email: "+email);
        Meteor.users.insert({profile:{username:username, avatar:avatar}, emails:[{address:email}],services:{ password:{"bcrypt" : "$2a$10$I3erQ084OiyILTv8ybtQ4ON6wusgPbMZ6.P33zzSDei.BbDL.Q4EO"}}});
      }
    }
  });

  Meteor.publish("chats", function(){
      var filter = {$or:[
                  {user1Id:this.userId},
                  {user2Id:this.userId}
                  ]};
      return Chats.find(filter);
  });
  Meteor.publish("users", function(){
      return Meteor.users.find();
  });
}

Meteor.methods({
    updateChat: function(chat) {
        Chats.update(chat._id, chat);
    },
    newChat : function(otherUserId){
        return Chats.insert({user1Id:Meteor.userId(), user2Id:otherUserId});
    }
});
