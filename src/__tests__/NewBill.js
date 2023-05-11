/**
 * @jest-environment jsdom
 */

import "@testing-library/jest-dom/extend-expect";
import { screen, fireEvent, waitFor } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import BillsUI from "../views/BillsUI.js";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import { ROUTES } from "../constants/routes";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store";

// import app/store.js and then link to mockStore
jest.mock("../app/store", () => mockStore);

// arrow function to navigate to the right path (second parameter in Bills)
const onNavigate = (pathname) => {
  document.body.innerHTML = ROUTES({ pathname });
};

describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    beforeEach(() => {
      // simmulate connection as an employee
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
    });

    window.localStorage.setItem(
      "user",
      JSON.stringify({
        type: "Employee",
        email: "employee@test.tld",
        password: "employee",
        status: "connected",
      })
    );
    // create a new bill form
    const html = NewBillUI();
    document.body.innerHTML = html;
  });
  test("Then it should display the NewBill Page", () => {
    // get the text in parentheses ("envoyer note de frais")
    const message = screen.getByText("Envoyer une note de frais");
    // make sure we get the expected message
    expect(message).toBeVisible();
    //get the testid in parentheses
    const formNewBill = screen.getByTestId("form-new-bill");
    // make sure the form is displayed on screen
    expect(formNewBill).toBeVisible();
  });
  describe("When I try to open a file with the wrong format in file's input", () => {
    test("Then the error message should be displayed", async () => {
      // create a new bill form
      const html = NewBillUI();
      document.body.innerHTML = html;

      // initiate the newBill form to test
      const newBill = new NewBill({
        document,
        onNavigate,
        store: null,
        localStorage: window.localStorage,
      });

      // recreate the function handle change to test it

      // const handleChangeFile is a Mock function
      const handleChangeFile = jest.fn(() => newBill.handleChangeFile);
      // get the testid in parentheses
      const inputFile = screen.getByTestId("file");
      // add an addEventListener to inputFile which take the function handleChangeFile as a parameter
      inputFile.addEventListener("change", handleChangeFile);
      // Fire the event with fireEvent (https://testing-library.com/docs/dom-testing-library/api-events/)
      fireEvent.change(inputFile, {
        target: {
          files: [
            new File(["funnyCat.gif"], "funnyCat.gif", { type: "image/gif" }),
          ],
        },
      });

      // add what is expected to happen
      expect(handleChangeFile).toBeCalled();
      expect(inputFile.files[0].name).toBe("funnyCat.gif");
      expect(screen.getByText("Envoyer une note de frais")).toBeTruthy();

      // Error div added in container > newBill and hidden in css.
      // It will show if the file tested is not an acceped format
      const error = screen.getByTestId("error-file");
      await waitFor(() => {
        expect(error.classList).toHaveLength(1);
      });
    });
  });
});

// cont to build a new note for test purposes
const newNote = {
  id: "HMIErt34fuYo08rtd",
  status: "refused",
  pct: 20,
  amount: 400,
  email: "hello@bye.com",
  name: "hello world",
  vat: "50",
  fileName: "hello-world.jpg",
  date: "2007-05-06",
  commentAdmin: "hello world",
  commentary: "test hello world",
  type: "world",
  fileUrl: "https://localhost:3456/images/hello-world.jpg"
};

// Test to check if a bill is added and if undefined call updateBill.
// then check if the bill is created and that you'e then redirected to bills
describe('When I submit the newbill', () => {

  // Test for dive into updateBill
  test('Then add the newbill', async () => {

   
      // build UI for newBill
      document.body.innerHTML = NewBillUI()

      // Initiate the newBill form to test
      const newBill = new NewBill({
          document,
          onNavigate,
          store: null,
          localStorage: window.localStorage,
      })

      // if it's undefined then call updateBill
      expect(newBill.updateBill(newNote)).toBeUndefined()
  })

  test('Then create Bill with input fields correctly completed and redirect to Bills', async () => {

      // create a new bill form
      document.body.innerHTML = NewBillUI()

      // Initiate the newBill form to test
      const newBill = new NewBill({
          document,
          onNavigate,
          store: mockStore,
          localStorage: window.localStorage,
      })

      newBill.updateBill = (bill) => bill

      // complete all input fields of the form
      document.querySelector(`select[data-testid="expense-type"]`).value = newNote.type
      document.querySelector(`input[data-testid="expense-name"]`).value = newNote.name
      document.querySelector(`input[data-testid="amount"]`).value = newNote.amount
      document.querySelector(`input[data-testid="datepicker"]`).value = newNote.date
      document.querySelector(`input[data-testid="vat"]`).value = newNote.vat
      document.querySelector(`input[data-testid="pct"]`).value = newNote.pct
      document.querySelector(`textarea[data-testid="commentary"]`).value = newNote.commentary
      newBill.fileUrl = newNote.fileUrl
      newBill.fileName = newNote.fileName

      // Get the form from data-testid
      const submit = screen.getByTestId('form-new-bill')

      // Add event listener Submit on form and fire
      const handleSubmit = jest.fn((e) => newBill.handleSubmit(e))
      submit.addEventListener('click', handleSubmit)
      userEvent.click(submit)
      expect(handleSubmit).toHaveBeenCalled()
      expect(screen.queryAllByText('Vous devez entrer un titre')).toHaveLength(0)
      // make sure that the btn-new-bill and "mes notes de frais" are visible
      // so we know we're back on bill page
      expect(screen.getByTestId('btn-new-bill')).toBeVisible()
      expect(screen.getByText('Mes notes de frais')).toBeVisible()
  })
})


// API POST
// POST est presque toujours favorisé lorsque l’utilisateur doit
// soumettre des données ou des fichiers au serveur,
// par exemple pour remplir des formulaires ou télécharger des photos.
describe("When I am on NewBill Page and submit the form", () => {
  test("Then it should create a New Bill", async () => {
    // spy on Bills method in mockstore
    const postSpyOn = jest.spyOn(mockStore, "bills");

    // We get the list of bills available in the mockstore
    const allBills = await mockStore.bills().list();
    // make sure it's called at least one time
    expect(postSpyOn).toHaveBeenCalledTimes(1);
    // Il y a bien 4 bills, par défault, dans le mockStore?
    expect(allBills.length).toBe(4);

    // New Bill that we're going to send in the mockstore
    let bill = {
      name: "Vacances à Bali",
      type: "Vacances",
      email: "employee@test.tld",
      amount: "600",
      date: "2019-09-10",
      vat: "60",
      pct: "20",
      commentary: "POST test",
      status: "pending",
      fileName: "test.jpg",
      fileUrl: "https://localhost:3456/images/test.jpg",
    };

    // creating the bill in the mockstore
    mockStore.bills().create(bill);

    // Le nombre de bills dans le store a t'il été incrémenté suite à notre update?
    waitFor(() => expect(allBills.length).toBe(5));
  });

  // error 404 means page not found
  // Follow. 404 error or 'page not found' error is a Hypertext Transfer Protocol standard response code
  // that indicates the server was unable to find what was requested.
  // This message may also appear when the server is not willing to disclose
  // the requested information or when the content has been deleted.
  test("Then it adds bill to the API and fails with 404 message error", async () => {
    //simulate API request that cause the 404 error
    jest
      .spyOn(mockStore, "bills")
      .mockImplementationOnce(() => Promise.reject(new Error("Erreur 404")));
    // Create UI with error 404
    const html = BillsUI({ error: "Erreur 404" });
    document.body.innerHTML = html;
    // response error beign displayed or not
    const message = screen.getByText(/Erreur 404/);
    expect(message).toBeTruthy();
  });
  // The HTTP status code 500 is a generic error response.
  // It means that the server encountered an unexpected condition that prevented it from fulfilling the request.
  // This error is usually returned by the server when no other error code is suitable.
  test("Then it adds bill to the API and fails with 505 message error", async () => {
    // //simulate API request that cause the 500 error
    jest.spyOn(mockStore, "bills").mockImplementationOnce(() => {
      Promise.reject(new Error("Erreur 500"));
    });
    // Create UI with error 500
    const html = BillsUI({ error: "Erreur 500" });
    document.body.innerHTML = html;

    // response error beign displayed or not
    const message = screen.getByText(/Erreur 500/);
    expect(message).toBeTruthy();
  });
});
