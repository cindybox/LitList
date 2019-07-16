//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");

const app = express();

app.set("view engine", "ejs");

app.use(
  bodyParser.urlencoded({
    extended: true
  })
);
app.use(express.static("public"));

mongoose.connect(
  process.env.ATLAS_URL + "/todoDB",
  {
    useNewUrlParser: true
  }
);

const itemsSchema = {
  name: String //has to be String not string??
};

const listScheme = {
  name: String,
  items: [itemsSchema] //?means new objects will be created?
};

const Item = mongoose.model("Item", itemsSchema);

const List = mongoose.model("Lists", listScheme); //the first name does not seem matter,
//then why is it needed? it is use to access all the methods. the later one is used to convert to list name in plural form

const item1 = new Item({
  name: "Welcome to LitList"
});
const item2 = new Item({
  name: "To Add new List, use the Plus Button"
});
const item3 = new Item({
  name: "Pick up grocery"
});

const defaultItems = [item1, item2, item3];
const day = date.getDate();

app.get("/", function(req, res) {
  Item.find({}, function(err, foundItems) {
    if (foundItems.length == 0) {
      Item.insertMany([item1, item2, item3], function(err) {
        if (err) {
          console.log(err);
        } else {
          console.log("done");
        }
      });
      res.redirect("/");
    } else {
      res.render("list", {
        listTitle: day,
        newListItems: foundItems
      });
    }
  });
});

app.post("/", function(req, res) {
  let listName = req.body.listName;
  if (listName === day) {
    const item = new Item({
      name: req.body.newItem
    });
    item.save();
    res.redirect("/");
  } else {
    const item = new Item({
      name: req.body.newItem
    });
    List.findOne(
      {
        name: listName
      },
      function(err, foundList) {
        if (!err) {
          foundList.items.push(item);
          foundList.save();
          res.redirect("/" + listName);
        } else {
          console.log("error");
        }
      }
    );
  }
});

app.post("/delete", function(req, res) {
  let listName = req.body.listName;
  if (listName === day) {
    Item.deleteOne(
      {
        _id: req.body.checkbox
      },
      function(err) {
        if (err) {
          console.log(err);
        } else {
          console.log("done");
        }
      }
    );
    res.redirect("/");
  } else {
    List.findOneAndUpdate(
      {
        name: listName
      },
      {
        $pull: {
          items: {
            _id: req.body.checkbox
          }
        }
      },
      function(err, foundList) {
        res.redirect("/" + foundList.name);
      }
    );
  }
});

app.get("/:listtypes", function(req, res) {
  let listName = req.params.listtypes;
  List.findOne(
    {
      name: listName
    },
    function(err, foundList) {
      if (!err) {
        if (!foundList) {
          let list = new List({
            name: listName,
            items: defaultItems
          });
          list.save(); //save it into the databse!!
          res.redirect("/" + listName);
        } else {
          res.render("list", {
            listTitle: listName,
            newListItems: foundList.items
          });
        }
      } else {
        console.log(err);
      }
    }
  );
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}
app.listen(port, function() {
  console.log("Server started on port 3000");
});
