document.addEventListener("DOMContentLoaded", function () {
  // Use buttons to toggle between views
  document
    .querySelector("#inbox")
    .addEventListener("click", () => load_mailbox("inbox"));
  document
    .querySelector("#sent")
    .addEventListener("click", () => load_mailbox("sent"));
  document
    .querySelector("#archived")
    .addEventListener("click", () => load_mailbox("archive"));
  document.querySelector("#compose").addEventListener("click", compose_email);

  // By default, load the inbox
  load_mailbox("inbox");
});

function load_mailbox(mailbox) {
  console.log("load mailbox", mailbox);

  // Send GET request for a specific mailbox
  fetch(`/emails/${mailbox}`)
    .then((response) => response.json())
    .then((emails) => {
      // Print emails
      console.log(emails);

      // Display the received mails from the request
      handle_mails(emails);
    });

  // Show the mailbox and hide other views
  document.querySelector("#emails-view").style.display = "block";
  document.querySelector("#compose-view").style.display = "none";
  document.querySelector("#email-details-view").style.display = "none";

  // Show the mailbox name
  document.querySelector("#emails-view").innerHTML = `<h3>${
    mailbox.charAt(0).toUpperCase() + mailbox.slice(1)
  }</h3>`;
}

function handle_mails(emails) {
  emails.forEach((email) => {
    // Create div element for each mail and set styling properties
    const element = document.createElement("div");
    element.setAttribute("class", "border border-secondary rounded-sm");
    element.setAttribute("id", "email");
    element.style.padding = "10px";
    element.style.marginBottom = "20px";

    // Set background color depending of the 'read' property
    if (email.read) {
      element.style.backgroundColor = "lightgrey";
    } else {
      element.style.backgroundColor = "white";
    }

    // Create div elements for the data of an email
    sender = document.createElement("div");
    sender.innerHTML = `FROM: ${email.sender}`;

    subject = document.createElement("div");
    subject.innerHTML = `SUBJECT: ${email.subject}`;

    timestamp = document.createElement("div");
    timestamp.innerHTML = `TIMESTAMP: ${email.timestamp}`;

    // Append data div elements of a mail to its parent div
    element.appendChild(sender);
    element.appendChild(subject);
    element.appendChild(timestamp);

    // Append parent div to the email view
    document.querySelector("#emails-view").append(element);

    // Await email elemnt to be clicked to show email details
    element.addEventListener("click", () => load_mail(email));
  });
}

function compose_email() {
  console.log("Start composing");

  // Show compose view and hide other views
  document.querySelector("#emails-view").style.display = "none";
  document.querySelector("#compose-view").style.display = "block";
  document.querySelector("#email-details-view").style.display = "none";

  // Clear out composition fields
  document.querySelector("#compose-recipients").value = "";
  document.querySelector("#compose-subject").value = "";
  document.querySelector("#compose-body").value = "";

  // Send POST request to compose email
  document.querySelector("#compose-form").onsubmit = function () {
    post_mail();

    // Prevent loading the default mailbox 'inbox'
    return false;
  };
}

function post_mail() {
  // Get required data for POST request
  const recipients = document.querySelector("#compose-recipients").value;
  const subject = document.querySelector("#compose-subject").value;
  const body = document.querySelector("#compose-body").value;

  // send POST request
  fetch("/emails", {
    method: "POST",
    body: JSON.stringify({
      recipients: recipients,
      subject: subject,
      body: body,
    }),
  })
    .then((response) => response.json())
    .then((result) => {
      if ("error" in result) {
        alert(result.error);
      } else {
        load_mailbox("sent");
      }

      console.log(result);
    });
}

function load_mail(email) {
  // Show the email details view and hide other views
  document.querySelector("#emails-view").style.display = "none";
  document.querySelector("#compose-view").style.display = "none";
  document.querySelector("#email-details-view").style.display = "block";

  document.querySelector("#email-meta").style.marginTop = "25px";

  // Set read property of email to true
  if (!email.read) {
    fetch(`/emails/${email.id}`, {
      method: "PUT",
      body: JSON.stringify({
        read: true,
      }),
    });
  }

  // Handle the option to archive and unarchive an email
  handle_archive_property(email);

  // Reply to the email
  document.querySelector("#reply").addEventListener("click", function () {
    reply_mail(email);
  });

  // Get and show details of an email
  fetch(`/emails/${email.id}`)
    .then((response) => response.json())
    .then((email) => {
      // Display email details
      document.querySelector("#sender-div").innerHTML = `FROM: ${email.sender}`;
      document.querySelector(
        "#recipients-div"
      ).innerHTML = `TO: ${email.recipients}`;
      document.querySelector(
        "#subject-div"
      ).innerHTML = `SUBJECT: ${email.subject}`;
      document.querySelector(
        "#timestamp-div"
      ).innerHTML = `TIMESTAMP: ${email.timestamp}`;
      document.querySelector("#body-div").innerHTML = `${email.body}`;
    });
}

function handle_archive_property(email) {
  // Show archive/unarchive button
  if (email.archived) {
    document.querySelector("#archive").style.display = "none";
    document.querySelector("#unarchive").style.display = "block";
  } else {
    document.querySelector("#archive").style.display = "block";
    document.querySelector("#unarchive").style.display = "none";
  }

  // Archive email
  document.querySelector("#archive").onclick = function () {
    change_archived(email, true);
    console.log("archive");
    return false;
  };

  // Unarchive email
  document.querySelector("#unarchive").onclick = function () {
    change_archived(email, false);
    console.log("unarchive");
    return false;
  };
}

function change_archived(email, state) {
  fetch(`/emails/${email.id}`, {
    method: "PUT",
    body: JSON.stringify({
      archived: state,
    }),
  }).then(() => {
    load_mailbox("inbox");
  });
}

function reply_mail(email) {
  // Show compose view and hide other views
  document.querySelector("#emails-view").style.display = "none";
  document.querySelector("#compose-view").style.display = "block";
  document.querySelector("#email-details-view").style.display = "none";

  // Prefill composition fields
  document.querySelector("#compose-recipients").value = email.sender;

  if (
    document
      .querySelector("#compose-subject")
      .value.substring(0, 3)
      .toString() == "Re:"
  ) {
    document.querySelector("#compose-subject").value = `${email.subject}`;
  } else {
    document.querySelector("#compose-subject").value = `Re: ${email.subject}`;
  }

  document.querySelector(
    "#compose-body"
  ).value = `On ${email.timestamp} ${email.sender} wrote: ${email.body}`;

  // Send POST request to compose email
  document.querySelector("#compose-form").onsubmit = function () {
    post_mail();

    // Prevent loading the default mailbox 'inbox'
    return false;
  };
}
