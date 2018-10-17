
/* PARSE MESSAGE */

function parseMessage ( message ) {
  return message.replace ( / \(HEAD\)$/i, '' ).replace ( / \(HEAD -> [^)]+\)$/i, '' ); //FIXME: Ugly, there should be a better way of doing it
}

/* EXPORT */

export default parseMessage;
