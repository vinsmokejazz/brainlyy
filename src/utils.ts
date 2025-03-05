export function random(len: number) {
  const options = "qwertyuiopasdfghjklzxcvbnm1234567890";
  const length = options.length;

  let ans = "";

  for (let i = 0; i < length; i++) {
    ans += options[Math.floor((Math.random() * length))]
  }
  return ans;
}