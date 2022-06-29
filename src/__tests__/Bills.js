/**
 * @jest-environment jsdom
 */

import { screen, waitFor } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import BillsUI from "../views/BillsUI.js";
import Bills from "../containers/Bills.js";
import { bills } from "../fixtures/bills.js";
import { ROUTES, ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store.js";
import router from "../app/Router.js";

// import app/store.js and then link to mockStore
jest.mock("../app/Store.js", () => mockStore);

// arrow function to navigate to the right path (second parameter in Bills)
const onNavigate = (pathname) => {
  document.body.innerHTML = ROUTES({ pathname });
};

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {
      // configure locastorage to be in employee mode
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.Bills);
      // icon-window from folder views > file VerticalLayout.js
      await waitFor(() => screen.getByTestId("icon-window"));
      const windowIcon = screen.getByTestId("icon-window");
      
      //active-icon from folder app > file Router.js
      expect(windowIcon.classList).toContain("active-icon");
    });
    test("Then bills should be ordered from earliest to latest", () => {
      // build UI
      document.body.innerHTML = BillsUI({ data: bills });
      // get text from HTML
      const dates = screen
        // getAllBy... Returns an array of all matching nodes for a query, and throws an error if no elements match.
        .getAllByText(
          /^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i
        )
        .map((a) => a.innerHTML);
      // Filter by date from earliest to latest
      const antiChrono = (a, b) => (a < b ? 1 : -1);
      const datesSorted = [...dates].sort(antiChrono);
      // Are the bills ordered as requested ?
      expect(dates).toEqual(datesSorted);
    });

    
    // test to make sure an new bill open when we click "Nouvelle note de frais" button

    describe('When I click on the button "Nouvelle note de frais"', () => {
      test("Then the New Bill menu should appear", async () => {

        // new const that equals a new Bills from the constructor from container > bills.js with the properties store and localStorage set to null
        const bills = new Bills({
          document,
          onNavigate,
          store: null,
          localStorage: window.localStorage,
        });

        // creation of a mock function with jest.fn taking a function that's going to be called in an addeventlistener ( https://www.pluralsight.com/guides/how-does-jest.fn()-work )
        const handleClickNewBill = jest.fn((e) => bills.handleClickNewBill(e));

        // get button from HTML
        const buttonNewBill = screen.getByTestId("btn-new-bill");

        //add an eventlistener to that button and call our mock function
        buttonNewBill.addEventListener("click", handleClickNewBill);

        // userEvent to simulate the click of the use to test our function
        userEvent.click(buttonNewBill);

        //const to get the form from folder views -> newBillsUI.js
        const formNewBill = screen.getByTestId("form-new-bill");

        // check if the function handleClickNewBill has been called or not
        expect(handleClickNewBill).toHaveBeenCalled();

        // check if a new bill has been opened or not
        expect(formNewBill).toBeTruthy();
      });
    });

    // function to make sure a modal open when we click the blue eye icon of a bill
    describe("When I click on the blue eye icon of a bill", () => {
      "";
      test("Then a modal should open with the bill file", () => {
        // construct UI
        const html = BillsUI({ data: bills });
        document.body.innerHTML = html;

        // new const that equals a new Bills from the constructor from container > bills.js with the properties store and localStorage set to null
        const testingBills = new Bills({
          document,
          onNavigate,
          store: null,
          localStorage: window.localStorage,
        });

        // allow to access boostrap modal from the folder views -> BillsUI.js file without getting the error "TypeError: $(...).modal is not a function"
        // $ stands for Jquery (it's the shortcut for jquery so you can write jQuery.fn.modal = jest.fn() or $.fn.modal = jest.fn() interchangeably)
        // link that help me to find the solution ( https://stackoverflow.com/questions/45225235/accessing-bootstrap-functionality-in-jest-testing )
        jQuery.fn.modal = jest.fn();
        // get button from HTML
        const iconEyes = screen.getAllByTestId("icon-eye");

        // creation of a mock function with jest.fn taking a function that's going to be called in an addeventlistener ( https://www.pluralsight.com/guides/how-does-jest.fn()-work )
        const handleClickIconEye = jest.fn(
          testingBills.handleClickIconEye(iconEyes[0])
        );

        //add an eventlistener to that button and call our mock function
        iconEyes[0].addEventListener("click", handleClickIconEye);

        // userEvent to simulate the click of the use to test our function
        userEvent.click(iconEyes[0]);

        // check if the function handleClickIconEye has been called or not
        expect(handleClickIconEye).toHaveBeenCalled();

        // check if the modal is present in the DOM
        const modalTarget = screen.getByTestId("modal");
        expect(modalTarget).toBeTruthy();
      });
    });
  });
});

// test d'intégration GET

// GET est particulièrement bien adapté pour personnaliser les sites Web : 
// les recherches des utilisateurs, les paramètres de filtrage et le tri des listes 
// peuvent être mis en marque-page avec l’URL, de sorte qu’à la 
// prochaine visite du site, l’utilisateur retrouvera la page telle qu’il l’a laissée.

// change dashboard to bills and admin to employee
describe("Given I am a user connected as Employee", () => {
  describe("When I navigate to Bills", () => {
    test("fetches bills from mock API GET", async () => {
      localStorage.setItem(
        "user",
        JSON.stringify({ type: "Employee", email: "a@a" })
      );
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.Bills);
      // changed text with "Mes notes de frais" (instead of what was written)
      await waitFor(() => screen.getByText("Mes notes de frais"));
      // make sure at least one bill is recovered
      expect(screen.getByTestId("tbody").childElementCount).toBeGreaterThan(1);
    });
    describe("When an error occurs on API", () => {
      beforeEach(() => {
        jest.spyOn(mockStore, "bills");
          // configure locastorage to be in employee mode
        Object.defineProperty(window, "localStorage", {
          value: localStorageMock,
        });
        window.localStorage.setItem(
          "user",
          JSON.stringify({
            type: "Employee",
            email: "a@a",
          })
        );
        const root = document.createElement("div");
        root.setAttribute("id", "root");
        document.body.appendChild(root);
        router();
      });
      test("fetches bills from an API and fails with 404 message error", async () => {
        mockStore.bills.mockImplementationOnce(() => {
          return {
            list: () => {
              return Promise.reject(new Error("Erreur 404"));
            },
          };
        });
        window.onNavigate(ROUTES_PATH.Bills);
        await new Promise(process.nextTick);
        const message = screen.getByText(/Erreur 404/);
        expect(message).toBeTruthy();
      });

      test("fetches messages from an API and fails with 500 message error", async () => {
        mockStore.bills.mockImplementationOnce(() => {
          return {
            list: () => {
              return Promise.reject(new Error("Erreur 500"));
            },
          };
        });

        window.onNavigate(ROUTES_PATH.Bills);
        await new Promise(process.nextTick);
        const message = screen.getByText(/Erreur 500/);
        expect(message).toBeTruthy();
      });
    });
  });
});
